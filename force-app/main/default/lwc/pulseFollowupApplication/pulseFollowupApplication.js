import { LightningElement, track, wire } from 'lwc';
import Id from '@salesforce/user/Id';
import UserNameFIELD from '@salesforce/schema/User.Name';
import { getRecord, notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import getFilterValues from '@salesforce/apex/FollowUpApllication.getFilterValues';
import getApplications from '@salesforce/apex/FollowUpApllication.getApplications';
import getAllFields from '@salesforce/apex/FollowUpApllication.getAllFields';
import Application_OBJECT from "@salesforce/schema/Application__c";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import updateRecords from '@salesforce/apex/FollowUpApllication.updateRecords';

export default class FollowUpApllication extends LightningElement {
    @track filter;
    @track sortByList = [
        { label: 'Follow Up Date - Oldest', value: 'Follow_Up__c ASC' },
        { label: 'Follow Up Date - Newest', value: 'Follow_Up__c DESC' },
        { label: 'Created Date - Oldest', value: 'CreatedDate ASC' },
        { label: 'Created Date - Newest', value: 'CreatedDate DESC' },
    ];

    @track displayList = [];
    @track userList = [];
    currentUserDetail = { Name: '', Id: '' };
    @track viewAsUser = { isSelected: false, name: '', id: '', sldsClass: 'slds-pill  user_pill', disable: false, sldsClass_button: 'slds-button slds-button_icon slds-button_icon slds-pill__remove' };
    @track followUpsOptions = [
        { label: 'All Follow Ups', value: true },
        { label: 'Due Follow Ups', value: false },
    ]
    selectedSortBy = null;
    selectedDisplayAs;
    isDisplayAsSelected = false;
    comboboxValue = null;
    applicationList;
    applicationAvailable = false;
    @track paginatedApplicationList = [];
    showPagination;
    pageSize = 20;
    isSortBySelected = false;
    isLoading = true;
    orderByValue;
    followUp = false;
    editModal = false;
    editModalId;
    applicationRecordTypeId;
    isFollowUpSelected = true;
    followUpToDisplay = 'Due Follow Ups';
    userTimeZone;
    isSortOrderChange = false;
    @track applicationType = [];
    searchTerm;
    isApplicationTypeSelected = false;
    selectedApplicationType;
    totalApplication = 0;
    applicationFields;
    @track test = '';

    //Changes by ps
    @wire(getAllFields)
    wiredFields({ error, data }) {
        if (data) {
            data.forEach(item => {
                var fieldApi = item.apiName.toLowerCase();
                let fieldApiToLowecase = fieldApi.toLowerCase();
                if (fieldApiToLowecase.includes('application_type')) {
                    var tempList = [];
                    for (let key in item.pickListValues) {
                        if (item.pickListValues.hasOwnProperty(key)) {
                            tempList.push({ label: key, value: item.pickListValues[key] });
                        }
                    }
                    this.applicationType = tempList;
                } else if (fieldApiToLowecase.includes('ple__stage__c')) {
                    var tempList = [];
                    for (let key in item.pickListValues) {
                        if (item.pickListValues.hasOwnProperty(key)) {
                            tempList.push({ label: key, value: item.pickListValues[key] });
                        }
                    }
                    this.displayList = JSON.parse(JSON.stringify(tempList));
                    this.displayList.push({ label: 'All Applications', value: 'All Applications' });
                }
            })
            this.test = JSON.parse(JSON.stringify(this.displayList[0].label));
        } else if (error) {
            console.error('Error fetching fields: ', error);
        }
    }

    @wire(getObjectInfo, { objectApiName: Application_OBJECT })
    results({ error, data }) {
        if (data) {
            this.applicationRecordTypeId = data.defaultRecordTypeId;
        } else if (error) {
            let err = error;
            if (err && err.body && err.body.message) {
                err = err.body.message;
            }
            this.showNotification('Error', 'An error occured ' + err, 'error');
            this.isLoading = false;
        }
    }


    /*@wire(getPicklistValues, { recordTypeId: "$applicationRecordTypeId", fieldApiName: Application_OBJECT.objectApiName + '.'+this.appType })
    picklistResultsSubType({ error, data }) {
        if (data) {
            this.applicationType = data.values;
        } else if (error) {
            let err = error;
            if (err && err.body && err.body.message) {
                err = err.body.message;
            }
            //this.showNotification('Error', 'An error occured ' + err, 'error');
            this.isLoading = false;
        }
    }

    @wire(getPicklistValues, { recordTypeId: "$applicationRecordTypeId", fieldApiName: Application_OBJECT.objectApiName + '.'+this.stg })
    picklistResultsStage({ error, data }) {
        if (data) {
            console.log('Stage data:', data.values);

            this.displayList = [...data.values];
            this.displayList.push({ label: 'All Applications', value: 'All Applications' });
            console.log('displayList', this.displayList);
        } else if (error) {
            let err = error;
            if (err && err.body && err.body.message) {
                err = err.body.message;
            }
            //this.showNotification('Error', 'An error occurred ' + err, 'error');
            this.isLoading = false;
        }
    }*/

    @wire(getRecord, { recordId: Id, fields: [UserNameFIELD] })
    currentUserInfo({ error, data }) {
        if (data) {
            this.currentUserDetail.Name = data.fields.Name.value;
            this.currentUserDetail.Id = data.id;
            this.getFilterValuesList();
            this.filter = {
                criteria: [
                    {
                        fieldPath: 'OwnerId',
                        operator: 'eq',
                        value: this.currentUserDetail.Id,
                    }]
            }
        } else if (error) {
            let err = error;
            if (err && err.body && err.body.message) {
                err = err.body.message;
            }
            this.showNotification('Error', 'An error occured ' + err, 'error');
            this.isLoading = false;
        }
    }

    fetchRequiredFields() {
        try {
            this.applicationFields.forEach(item => {
                var tempItem = item.toLowerCase();
                if (tempItem.includes('application_type')) {
                    this.appType = tempItem;
                } else if (tempItem.includes('stage')) {
                    this.stage = tempItem;
                } else if (tempItem.includes('follow_up_date')) {
                    this.followUpDate = tempItem;
                }
            })
        } catch (err) {
            console.error(err);
        }
    }

    getFilterValuesList() {
        getFilterValues()
            .then((result) => {
                this.getApplicationList(this.currentUserDetail.Id, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
                if (result) {
                    console.log(result);
                    this.userTimeZone = result.userTimeZone;
                    if (result.userList && result.userList.length > 0) {
                        this.userList = result.userList
                            .filter(user => user.Name !== this.currentUserDetail.Name)
                            .map(user => ({ label: user.Name, value: user.OwnerId }));
                        this.userList.unshift({ label: 'All', value: 'All' })
                        if (!this.userList || this.userList.length == 0) {
                            this.viewAsUser.sldsClass = 'slds-pill  user_pill disabled';
                            this.viewAsUser.disable = true;
                            this.viewAsUser.isSelected = true;
                            this.viewAsUser.name = this.currentUserDetail.Name;
                            this.viewAsUser.sldsClass_button = 'slds-button_icon  disabled remove_border'
                        }
                    }
                }
            }).catch((err) => {
                console.log(err);
                let error = err;
                if (error && error.body && error.body.message) {
                    error = error.body.message;
                }
                this.showNotification('Error', 'An error occured ' + error, 'error');
                this.isLoading = false;
            });
    }


    formatCreatedDate(date) {
        // Convert the date to the user's time zone
        const dateInUserTimeZone = new Date(date).toLocaleString('en-US', { timeZone: this.userTimeZone });
        // Create a new Date object from the converted date string
        const userDate = new Date(dateInUserTimeZone);

        // Format the date and time
        const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
        return userDate.toLocaleString('en-US', options);
    }


    getApplicationList(onwerId, followUp, orderBy, displayAs, applicationType) {
        if (displayAs == 'All Applications') {
            displayAs = null;
        }
        getApplications({ ownerId: onwerId, followUps: followUp, orderBy: orderBy, stage: displayAs, applicationType: applicationType })
            .then((result) => {
                this.showPagination = false;
                console.log(result);
                if (result && result.length > 0) {
                    console.log('result if');
                    console.log('result', result);
                    this.applicationList = result;
                    this.applicationList.forEach((elle) => {
                        elle['isAccordianOpen'] = false;
                        elle['isFollowUpAvailable'] = false;
                        elle['isNameEditable'] = false;
                        elle['isFollowUpEditable'] = false;
                        elle['isStageEditable'] = false;
                        elle.CreatedDate = this.formatCreatedDate(elle.CreatedDate);
                        elle['formatFollowUpDate'] = '';
                        console.log('elle');
                        console.log(elle);
                        console.log(elle.ple__Follow_Up__c);
                        if (elle.ple__Follow_Up__c && elle.ple__Follow_Up__c.length > 0) {
                            elle['formatFollowUpDate'] = this.formatDate(elle.ple__Follow_Up__c);
                            elle['formatFollowUpDate2'] = new Date(`${elle.ple__Follow_Up__c}T00:00:00Z`).toISOString();
                        }
                    })
                    this.totalApplication = this.applicationList.length;
                    this.handleApplicationSearchChange();
                    this.paginatedApplicationList = this.applicationList.slice(0, this.pageSize);
                    this.showPagination = this.applicationList.length > this.pageSize;
                    if (this.showPagination) {
                        // let obj = {target:{label : 1}};
                        // this.template.querySelector('c-pagination').handleClick(obj);
                        let elle = this.template.querySelector('c-pagination');
                        console.log('elle', elle);
                        if (elle) {
                            let page = elle.getClickedPage();
                            console.log(page);
                            let totalpages = Math.ceil(Number(this.totalApplication) / Number(this.pageSize));
                            console.log('total page');
                            console.log(totalpages);
                            if (page > totalpages) {
                                elle.resetThePage();
                            }
                            else {
                                this.paginatedApplicationList = this.applicationList.slice((this.pageSize * page) - this.pageSize, this.pageSize * page);
                            }
                            console.log(this.paginatedApplicationList);
                        }
                    }
                    this.applicationAvailable = true;
                }
                else {
                    console.log('result else');
                    this.applicationAvailable = false;
                }
                this.isLoading = false
            }).catch((err) => {
                console.log(err);
                let error = err;
                if (error && error.body && error.body.message) {
                    error = error.body.message;
                }
                this.showNotification('Error', 'An error occured ' + error, 'error');
                this.isLoading = false;
            });
    }

    formatDate(date) {
        const month = new Date(date).getMonth() + 1;
        const day = new Date(date).getDate();
        const year = new Date(date).getFullYear();
        return `${month}/${day}/${year}`;
    }

    handleApplicationSearchChange(event) {
        this.isLoading = true;
        console.log(event);
        if (event && event.target) {
            const searchTerm = event.target.value.toLowerCase();
            console.log(searchTerm);
            this.searchTerm = searchTerm;
        }
        let filterResult;
        console.log('applicationAvailable',this.applicationAvailable);
        if (this.searchTerm && this.searchTerm.length > 0 && this.applicationAvailable) {
            console.log(this.searchTerm);
            console.log(this.applicationList);
            filterResult = this.applicationList.filter(application => application.Name.toLowerCase().includes(this.searchTerm));
            console.log(filterResult);
        }
        else {
            filterResult = this.applicationList;
        }
        console.log(this.searchTerm);
        console.log(filterResult);
        this.applicationAvailable = filterResult && filterResult.length > 0
        if (filterResult && filterResult.length > 0) {
            this.paginatedApplicationList = filterResult.slice(0, this.pageSize);
            this.showPagination = filterResult.length > this.pageSize;
            this.totalApplication = filterResult.length;
        }
        this.isLoading = false;
    }

    handleUserChange(event) {
        if (event.detail.value) {
            this.isLoading = true;
            this.viewAsUser.name = event.target.options.find(opt => opt.value === event.detail.value).label;
            this.viewAsUser.id = event.detail.value;
            this.viewAsUser.isSelected = true;
            this.getApplicationList(this.viewAsUser.id, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
            console.log(this.viewAsUser.name);
            if (this.viewAsUser.name && this.viewAsUser.name != 'All') {
                this.filter = {
                    criteria: [
                        {
                            fieldPath: 'OwnerId',
                            operator: 'eq',
                            value: this.viewAsUser.id,
                        }]
                }
            }
            else {
                this.filter = '';
            }
        }
    }

    removeUserSelected() {
        if (this.viewAsUser.disable == false) {
            this.isLoading = true;
            this.viewAsUser.isSelected = false;
            this.comboboxValue = null;
            let user = this.currentUserDetail.Id;
            if (this.viewAsUser.isSelected) {
                user = this.viewAsUser.id;
            }
            this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
            this.filter = {
                criteria: [
                    {
                        fieldPath: 'OwnerId',
                        operator: 'eq',
                        value: this.currentUserDetail.Id,
                    }]
            }
        }
    }

    async handleSaveClick(event) {

        console.log('Save click');
        console.log(event);
        this.isLoading = true;
        let applicationToUpdate = JSON.parse(event.detail.records);
        console.log(applicationToUpdate);
        if (applicationToUpdate && applicationToUpdate.length > 0) {
            try {
                await updateRecords({ applications: JSON.stringify(applicationToUpdate) });
                console.log('test');
                console.log(applicationToUpdate);
                let recordIds = applicationToUpdate.map(elle => elle.Id);
                console.log(recordIds);
                await notifyRecordUpdateAvailable([{ recordId: recordIds }]);
                console.log('notified');
                let user = this.currentUserDetail.Id;
                if (this.viewAsUser.isSelected) {
                    user = this.viewAsUser.id;
                }
                console.log(user);
                this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
                this.template.querySelector('c-custom-list-view-for-application').handleDismiss();
                this.showNotification('Success', 'Records updated successfully', 'success');
            } catch (err) {
                this.isLoading = false;
                console.error(err);
                let errorMessage = 'An error occurred';
                if (err && err.body && err.body.message) {
                    errorMessage = err.body.message;
                }
                this.showNotification('Error', errorMessage, 'error');
            }
        }
    }

    handleSort(event) {
        this.isLoading = true;
        this.orderByValue = event.detail.orderby;
        console.log(this.orderByValue);
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.isSortOrderChange = true;
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }


    handleSortChange(event) {
        this.isLoading = true;
        let value = event.detail.value;
        if (value) {
            this.selectedSortBy = event.target.options.find(opt => opt.value === event.detail.value).label;
            this.isSortBySelected = true;
            this.orderByValue = value;
        }
        else {
            this.selectedSortBy = null;
            this.isSortBySelected = false;
            this.orderByValue = null;
        }
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }

    handleDisplayRemove(event) {
        this.isLoading = true;
        event.stopPropagation();
        this.isDisplayAsSelected = false;
        this.selectedDisplayAs = null;
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }

    handleFollowUpRemove(event) {
        this.isLoading = true;
        event.stopPropagation();
        this.isFollowUpSelected = false;
        this.followUp = true;
        this.followUpToDisplay = null;
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }

    handleApplicationTypeRemove(event) {
        this.isLoading = true;
        event.stopPropagation();
        this.isApplicationTypeSelected = false;
        this.selectedApplicationType = null;
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }

    handleDisplayChange(event) {
        this.isLoading = true;
        let value = event.detail.value;
        if (value) {
            this.selectedDisplayAs = value;
            this.isDisplayAsSelected = true;
        }
        else {
            this.selectedDisplayAs = null;
            this.isDisplayAsSelected = false;
        }
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }

    handleFollowUpsChange(event) {
        this.isLoading = true;
        let value = event.detail.value;
        if (value) {
            this.followUp = value;
            this.followUpToDisplay = event.target.options.find(opt => String(opt.value) == String(value)).label;
            this.isFollowUpSelected = true;
        }
        else {
            this.followUp = true;
            this.isFollowUpSelected = false;
            this.followUpToDisplay = null;
        }
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }

    handleApplicationTypeChange(event) {
        this.isLoading = true;
        let value = event.detail.value;
        if (value) {
            this.selectedApplicationType = value;
            this.isApplicationTypeSelected = true;
        }
        else {
            this.selectedApplicationType = null;
            this.isApplicationTypeSelected = false;
        }
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }


    handleCancel(event) {
        if (this.editModal == true) {
            this.editModal = false;
        }
        else {
            this.paginatedApplicationList.forEach((elle, index) => {
                elle.isAccordianOpen = false;
            })
        }
    }

    handlePagination(event) {
        const selectedPage = event.detail;
        const startIdx = (selectedPage - 1) * this.pageSize;
        const endIdx = startIdx + this.pageSize;
        this.paginatedApplicationList = this.applicationList.slice(startIdx, endIdx);
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    openEditModal(event) {
        event.preventDefault();
        this.editModal = true;
        console.log(event.detail);
        let obj = event.detail;
        console.log(obj);
        this.editModalId = obj.referralRecordId;
        this.isLoading = true;
    }

    closeEditModal() {
        this.editModal = false;
        this.editModalId = null;
    }

    handleStopSpinner() {
        this.isLoading = false;
    }

    handleShowSpinner() {
        this.isLoading = true;
    }

    getLatestData() {
        this.isLoading = true;
        this.showNotification('Success', 'Record Updated Successfully!', 'success');
        let user = this.currentUserDetail.Id;
        if (this.viewAsUser.isSelected) {
            user = this.viewAsUser.id;
        }
        this.getApplicationList(user, this.followUp, this.orderByValue, this.selectedDisplayAs, this.selectedApplicationType);
    }

    handleModalCancel() {
        this.template.querySelector('.custom_edit_modal').handleDismiss();
    }
    handleModalSave() {
        this.template.querySelector('.custom_edit_modal').handleSave();
    }
}
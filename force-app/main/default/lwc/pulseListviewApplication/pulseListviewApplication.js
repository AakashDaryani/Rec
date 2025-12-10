import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import Application_OBJECT from "@salesforce/schema/Application__c";
import getAllFields from '@salesforce/apex/FollowUpApllication.getAllFields';
import { ShowToastEvent } from "lightning/platformShowToastEvent";


export default class CustomListViewForApplication extends NavigationMixin(LightningElement) {

    @track applicationToDisplay;
    @track selectedAction = { followUp: false, stage: false, marketer: false, owner: false };
    currentEditableField = { name: '', index: '', isAvailable: false, fieldApiName: '', isEdited: false };
    stageOptions = new Array();
    fieldChangeMap = new Map();
    isLoading = true;
    showFotter = false;
    tempApplicationList;
    actionOptions = [{ label: 'Update Follow Up Date', value: 'Update Follow Up Date', isSelected: false }, { label: 'Update Stage', value: 'Update Stage', isSelected: false }, { label: 'Change Owner', value: 'Change Owner', isSelected: false }];
    openActionDropDown = false;
    isApplicationUpdated = false;
    isActionModalOpen = false;
    modalHeader;
    selectedRecordIds = new Array();
    @track sortBySelection = { name: { asc: false, desc: false, isSelected: false }, followUpDate: { asc: false, desc: false }, stage: { asc: false, desc: false }, createdDate: { asc: false, desc: false }, applicationTypeSort: {asc: false, desc: false} };
    orderByValue;
    applicationRecordTypeId;
    followUpDate = '';
    stg = '';
    selectedActionValue = null;
    openConfirmationScreen = false;
    selectedFieldApiName;
    applicationTypeOptions;

    renderedCallback() {
        if (this.isApplicationUpdated) {
            let masterCheckbox = this.template.querySelector('.master_checkbox');
            if (masterCheckbox) {
                let isChecked = masterCheckbox.checked;
                const checkboxes = this.template.querySelectorAll('.input_checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
                if (isChecked == false && this.selectedRecordIds && this.selectedRecordIds.length > 0) {
                    let indexOfSelectedValues = new Array();
                    let checkBoxElements = this.template.querySelectorAll('.input_checkbox');
                    this.applicationToDisplay.forEach((elle, index) => {
                        if (this.selectedRecordIds.includes(elle.Id)) {
                            indexOfSelectedValues.push(index);
                            checkBoxElements[index].checked = true;
                        }
                    });
                }

            }
            var tt = JSON.stringify(this.applicationToDisplay);
            tt = JSON.parse(tt);
            for (var i = 0; i < tt.length; i++) {
                tt[i].followUpDate = tt[i][this.followUpDate];
                tt[i].stage = tt[i][this.stg];
            }
            this.applicationToDisplay = tt;
            this.isApplicationUpdated = false
        }
    }

    _totalRecords;
    @api
    get totalRecords() {
        return this._totalRecords;
    }
    set totalRecords(value) {
        this._totalRecords = value;
    }

    @api
    set applicationList(value) {
        console.log('value', value);
        this.applicationToDisplay = value;
        this.isApplicationUpdated = true;
        this.tempApplicationList = JSON.parse(JSON.stringify(this.applicationToDisplay));
        this.isLoading = false;
    }
    get applicationList() {
        return this.applicationToDisplay;
    }

    @api
    set orderBy(value) {
        console.log('order by');
        console.log(value);
        this.orderByValue = value;
        console.log(this.orderByValue);
        if (this.orderByValue) {
            for (const key in this.sortBySelection) {
                this.sortBySelection[key] = { asc: false, desc: false, isSelected: false };
            }
            console.log('found order by value');
            if (this.orderByValue == 'Name ASC') {
                this.sortBySelection.name = { asc: true, desc: false, isSelected: true };
            } else if (this.orderByValue == 'Name DESC') {
                this.sortBySelection.name = { asc: false, desc: true, isSelected: true };
            } else if (this.orderByValue == this.followUpDate + ' ASC') {
                this.sortBySelection.followUpDate = { asc: true, desc: false, isSelected: true };
            } else if (this.orderByValue == this.followUpDate + ' DESC') {
                this.sortBySelection.followUpDate = { asc: false, desc: true, isSelected: true };
            } else if (this.orderByValue == this.stg + ' ASC') {
                this.sortBySelection.stage = { asc: true, desc: false, isSelected: true };
            } else if (this.orderByValue == this.stg + ' DESC') {
                this.sortBySelection.stage = { asc: false, desc: true, isSelected: true };
            } else if (this.orderByValue == 'CreatedDate ASC') {
                this.sortBySelection.createdDate = { asc: true, desc: false, isSelected: true };
            } else if (this.orderByValue == 'CreatedDate DESC') {
                this.sortBySelection.createdDate = { asc: false, desc: true, isSelected: true };
            }else if (this.orderByValue == 'ple__Application_Type__c ASC') {
                console.log('in if');
                console.log('application ASC');
                this.sortBySelection.applicationTypeSort = { asc: true, desc: false, isSelected: true };
            } else if (this.orderByValue == 'ple__Application_Type__c DESC') {
                console.log('in if');
                console.log('application DESC');
                this.sortBySelection.applicationTypeSort = { asc: false, desc: true, isSelected: true };
            }
            console.log('last');
            console.log(JSON.stringify(this.sortBySelection));
        }
    }
    get orderBy() {
        return orderByValue
    }

    //Changes by Ps
    @wire(getAllFields)
    wiredFields({ error, data }) {
        if (data) {
            data.forEach(item => {
                console.log('item',item);
                var fieldApi = item.apiName;
                let fieldApiLower = fieldApi.toLowerCase();
                if (fieldApiLower.includes('ple__stage__c')) {
                    this.stg = fieldApi;
                    var tempList = [];
                    for (let key in item.pickListValues) {
                        if (item.pickListValues.hasOwnProperty(key)) {
                            tempList.push({ label: key, value: item.pickListValues[key] });
                        }
                    }
                    this.stageOptions = tempList
                } else if (fieldApiLower.includes('follow_up')) {
                    console.log('incluldes');
                    console.log(fieldApi);
                    this.followUpDate = fieldApi;
                } else if (fieldApiLower.includes('application_type')) {
                    var tempList = [];
                    for (let key in item.pickListValues) {
                        if (item.pickListValues.hasOwnProperty(key)) {
                            tempList.push({ label: key, value: item.pickListValues[key] });
                        }
                    }
                    console.log('templist');
                    console.log(tempList);
                    this.applicationTypeOptions = tempList;
                }
            })
            this.stageOptions.unshift({ value: null, label: '--None--' }); // Add --None-- option
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

    /*@wire(getPicklistValues, { recordTypeId: "$applicationRecordTypeId", fieldApiName: Application_OBJECT.objectApiName + '.Stage__c' })
    picklistResults({ error, data }) {
        if (data) {
            if (Array.isArray(data.values)) {
                this.stageOptions = [...data.values]; // Copy values array
                this.stageOptions.unshift({ value: null, label: '--None--' }); // Add --None-- option
            }
        } else if (error) {
            console.error('Error fetching picklist values:', error);
        }
    }*/


    connectedCallback() {
        document.addEventListener('click', this.close.bind(this));
    }

    close() {
        this.openActionDropDown = false;
        this.closeCurrentEditableField();
    }

    handleCheckBoxChange(event) {
        const isChecked = event.target.checked;
        console.log(isChecked);
        const checkboxes = this.template.querySelectorAll('.input_checkbox');
        console.log(checkboxes);
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    }

    handleSortClick(event) {
        let colName = event.currentTarget.dataset.colname;
        let apiName = event.currentTarget.dataset.apiname;
        let type;
        for (const key in this.sortBySelection) {
            if (key !== colName) {
                this.sortBySelection[key] = { asc: false, desc: false, isSelected: false };
            }
        }
        console.log(colName);
        console.log(JSON.stringify(this.sortBySelection[colName]));
        if (this.sortBySelection[colName].asc) {
            this.sortBySelection[colName].desc = true;
            this.sortBySelection[colName].asc = false;
            type = 'DESC';
        } else {
            this.sortBySelection[colName].asc = true;
            this.sortBySelection[colName].desc = false;
            type = 'ASC';
        }
        this.sortBySelection[colName].isSelected = true;
        console.log(JSON.stringify(this.sortBySelection[colName]));
        console.log(type);
        console.log(apiName);
        const sort = new CustomEvent("sort", {
            detail: {
                orderby: apiName + ' ' + type,
            }
        });
        this.dispatchEvent(sort);
    }

    closeCurrentEditableField() {
        if (this.currentEditableField.isAvailable) {
            let newApplicationList = [...this.applicationToDisplay];
            newApplicationList[this.currentEditableField.index] = {
                ...newApplicationList[this.currentEditableField.index],
                [this.currentEditableField.name]: false
            };
            this.applicationToDisplay = newApplicationList;
            if (this.currentEditableField.isEdited) {
                this.showFotter = true;
                this.template.querySelectorAll(`.${this.currentEditableField.fieldApiName}`)[this.currentEditableField.index].classList.add('changed_input')
            }
            this.currentEditableField = { name: '', index: '', isAvailable: false };
        }
    }

    handleFollowUpClick(event) {
        event.stopPropagation();
        this.openActionDropDown = !this.openActionDropDown;
    }

    handleFollowUpSelect(event) {
        this.selectedRecordIds = new Array();
        let elements = this.template.querySelectorAll('.input_checkbox');
        if (elements.length > 0) {
            elements.forEach((el) => {
                console.log(el);
                console.log(el.checked);
                if (el.checked) {
                    console.log(el.dataset.id);
                    this.selectedRecordIds.push(el.dataset.id);
                }
            });
            if (this.selectedRecordIds.length > 0) {
                this.isActionModalOpen = true;
                this.modalHeader = event.currentTarget.dataset.value;
                this.selectedAction = { followUp: false, stage: false, marketer: false, owner: false };
                if (this.modalHeader == 'Update Follow Up Date') {
                    this.selectedAction.followUp = true;
                } else if (this.modalHeader == 'Update Stage') {
                    this.selectedAction.stage = true;
                } else if (this.modalHeader == 'Change Owner') {
                    this.selectedAction.owner = true;
                }
            } else {
                this.showNotification('Error', 'Please select at least one record', 'error');
            }
        } else {
            this.showNotification('Error', 'Please select at least one record', 'error');
        }
    }


    handleActionModalClose() {
        this.isActionModalOpen = false;
        this.openConfirmationScreen = false;
    }

    navigateToRecordPage(event) {
        try {
            let recordId = event.currentTarget.dataset.id;
            this[NavigationMixin.GenerateUrl]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: recordId,
                    actionName: 'view',
                    objectApiName: 'Your_Object_API_Name' // optional but good practice
                }
            }).then(url => {
                window.open(url, '_blank');
            });
        } catch (err) {
             console.error(err);
        }
    }

    openEditable(event) {
        event.stopPropagation();
        this.closeCurrentEditableField();
        let index = event.currentTarget.dataset.index;
        let property = event.currentTarget.dataset.property;
        this.currentEditableField.isAvailable = true;
        this.currentEditableField.name = property
        this.currentEditableField.index = index;
        let newApplicationList = [...this.applicationToDisplay];
        newApplicationList[index] = {
            ...newApplicationList[index],
            [property]: true
        };
        this.applicationToDisplay = newApplicationList;
    }

    getMenuItem(event) {
        let recordId = event.currentTarget.dataset.id;
        const openModal = new CustomEvent("openmodal", {
            detail: {
                referralRecordId: recordId
            }
        });
        this.dispatchEvent(openModal);
    }

    resizeColumn(event) {
        const colIndex = event.currentTarget.dataset.colIndex;
        const col = this.template.querySelector(`th[data-col-index="${colIndex}"]`);
        let mouseStart = event.clientX;
        let oldWidth = col.offsetWidth;
        const handleMouseMove = (event) => {
            let newWidth = event.clientX - mouseStart + oldWidth;
            col.style.width = newWidth + 'px';
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    handleInputChange(event) {
        try {
            console.log(event);
            event.preventDefault();
            event.stopPropagation();
            let valueToAssign;
            let fieldName = event.currentTarget.dataset.fieldapiname;
            console.log(fieldName);
            if (fieldName == this.stg) {
                valueToAssign = event.detail.value;
            }
            else {
                valueToAssign = event.currentTarget.value;
                if (fieldName == 'Name' && !valueToAssign && valueToAssign.length <= 0) {
                    const inputField = this.template.querySelectorAll(`[data-fieldapiname="${fieldName}"]`)[event.currentTarget.dataset.index];
                    inputField.setCustomValidity('Complete this field.');
                    inputField.reportValidity();
                    return;
                }
            }
            console.log(valueToAssign);
            this.currentEditableField.fieldApiName = fieldName;
            this.currentEditableField.isEdited = true;
            console.log('Compare1 : ', fieldName);
            console.log('Compare2 : ', this.followUpDate);
            if (fieldName == this.followUpDate) {
                console.log('in if');
                console.log(valueToAssign);
                if (valueToAssign && valueToAssign.length > 0) {
                    console.log('Line 343', this.applicationToDisplay[event.currentTarget.dataset.index][this.followUpDate]);
                    console.log(this.formatDate(valueToAssign));
                    this.applicationToDisplay[event.currentTarget.dataset.index][this.followUpDate] = valueToAssign;
                    this.applicationToDisplay[event.currentTarget.dataset.index]['formatFollowUpDate'] = this.formatDate(valueToAssign);
                    this.applicationToDisplay[event.currentTarget.dataset.index]['formatFollowUpDate2'] = new Date(`${valueToAssign}T00:00:00Z`).toISOString();
                }
                else {
                    let newApplicationList = [...this.applicationToDisplay];
                    newApplicationList[event.currentTarget.dataset.index] = {
                        ...newApplicationList[event.currentTarget.dataset.index],
                        ple__Follow_Up__c: null
                    };
                    this.applicationToDisplay = newApplicationList;
                    console.log(this.applicationToDisplay);
                }
            }
            else {
                this.applicationToDisplay[event.currentTarget.dataset.index][fieldName] = valueToAssign;
                console.log(this.applicationToDisplay);
            }

            if (this.fieldChangeMap.has(event.currentTarget.dataset.id)) {
                this.fieldChangeMap.get(event.currentTarget.dataset.id)[fieldName] = valueToAssign;
            } else {
                let obj = {
                    'Id': event.currentTarget.dataset.id,
                    [fieldName]: valueToAssign
                };
                console.log('final');
                console.log(obj);
                this.fieldChangeMap.set(event.currentTarget.dataset.id, obj);
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    handleInputClick(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    @api
    handleDismiss() {
        this.isLoading = true;
        this.showFotter = false;
        let ellments = this.template.querySelectorAll('.changed_input');
        ellments.forEach((elle) => {
            elle.classList.remove('changed_input');
        })
        this.applicationToDisplay = JSON.parse(JSON.stringify(this.tempApplicationList));
        setInterval(() => {
            this.isLoading = false;
        }, 200)
    }

    handleSave() {
        console.log(this.fieldChangeMap);
        // this.isLoading = true;
        const save = new CustomEvent("save", {
            detail: {
                records: JSON.stringify(Array.from(this.fieldChangeMap.values()))
            }
        });
        this.dispatchEvent(save);
        //handleDismiss();
    }

    handleActionClick() {
        let value;
        let fieldApiName;
        if (this.selectedAction.followUp) {
            value = this.template.querySelector('.follow_up_date_value').value;
            fieldApiName = this.followUpDate;
        } else if (this.selectedAction.owner) {
            value = this.template.querySelector('.user_value').value;
            fieldApiName = 'OwnerId';
        } else if (this.selectedAction.stage) {
            value = this.template.querySelector('.stage_value').value;
            fieldApiName = this.stg;
        }
        console.log(value);
        console.log(fieldApiName);
        if (!value || value.length == 0) {
            this.showNotification('Error', 'Please Select a valid Value', 'error');
            return;
        }
        else {
            this.selectedActionValue = value;
            this.openConfirmationScreen = true;
            this.selectedFieldApiName = fieldApiName;
        }
    }

    handleConfirmationClick() {
        console.log(this.selectedActionValue);
        if (this.selectedActionValue && this.selectedFieldApiName) {
            let recordsToUpdate = new Array();
            this.selectedRecordIds.forEach((elle) => {
                console.log(elle);
                let obj = { 'Id': elle };
                console.log(obj);
                obj[this.selectedFieldApiName] = this.selectedActionValue;
                console.log(obj);
                recordsToUpdate.push(obj);
                console.log(obj);
            });
            const save = new CustomEvent("save", {
                detail: {
                    records: JSON.stringify(recordsToUpdate)
                }
            });
            this.dispatchEvent(save);
            this.isActionModalOpen = false;
            this.openConfirmationScreen = false;
        }
    }

    closeConfirmationModal() {
        this.openConfirmationScreen = false;
        this.isActionModalOpen = false;
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

}
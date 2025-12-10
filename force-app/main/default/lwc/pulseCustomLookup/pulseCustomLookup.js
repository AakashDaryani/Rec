import { LightningElement, api, track } from 'lwc';
import getRecords from '@salesforce/apex/CustomLookUpController.fetchRecords';
import { NavigationMixin } from 'lightning/navigation';
import {FlowAttributeChangeEvent} from 'lightning/flowSupport';
export default class CustomLookUp extends NavigationMixin(LightningElement) {
    searchSentence = '';
    // @api filterFieldName;
    @api recordTypeId;
    @api label;
    @api labelForAddButton = 'Add';
    @api defaultValue;
    @api objectApiName;
    @api fieldName;
    @api recordId
    @track listOfRecords = null;
    @track filteredListOfRecords = null;
    @track showModal = false;
    iconName = 'standard:contact';
    showSpinner = false;

    listEmptyOrNot = false;
    recordNotSelected = true;

    selectedRecord = null;
    selectedRecordName = null;

    get inputVariables() {
        return [{ name: "recordId", type: "String", value: (this.recordId || '') }]
    }

    connectedCallback() {
        // if(this.objectApiName !== 'Contact'){
        //     this.iconName = 'custom:custom6';
        // }
        this.showSpinner = true;
        if (this.objectApiName != null && this.listOfRecords == null) {
            this.fetchRecords();
        }
    }


    fetchRecords() {
        //console.log(this.searchSentence)
        getRecords({ objectName: this.objectApiName, fieldName: this.fieldName, searchTerm: this.searchSentence.replaceAll(' ','%'), recordTypeId: this.recordTypeId, defaultId: this.defaultValue
         })
            .then(result => {
               // console.log(result,this.defaultValue)
                let arr = [];
                result.forEach((item) => {
                    let fieldName = Object.keys(item).find(str => str.toLowerCase() == this.fieldName.toLowerCase())
                    if (this.defaultValue == item.Id) {
                        this.selectedRecord = item.Id;
                        this.selectedRecordName = item[fieldName];
                        this.recordNotSelected = false;
                        this.dispatchEvent(new FlowAttributeChangeEvent('recordId', this.defaultValue));
                    }

                    arr.push({
                        Id: item.Id,
                        fieldName: fieldName,
                        value: item[fieldName]
                    })
                })
                this.listOfRecords = arr;
                this.filteredListOfRecords = arr;
                if (this.filteredListOfRecords.length < 0) this.listEmptyOrNot = false;
                else this.listEmptyOrNot = true;
                this.showSpinner = false;
            })
            .catch(error => {
                console.log('Error1: ' , error);
            });
    }

    showOptions() {
        var optionsListElement = this.template.querySelector('.options');
        if (optionsListElement)
            optionsListElement.classList.remove('displayNone');
        this.fetchRecords();
    }

    hideOptions() {
        var optionsListElement = this.template.querySelector('.options');
        if (optionsListElement) {
            setTimeout(function () {
                optionsListElement.classList.add('displayNone');
            }, 300);
        }
    }

    selectRecord(event) {
        this.selectedRecord = event.currentTarget.dataset.key;

        for (let i = 0; i < this.listOfRecords.length; i++) {
            if (this.listOfRecords[i].Id == this.selectedRecord) {
                this.selectedRecordName = this.listOfRecords[i].value;
                break;
            }
        }

        if (this.selectedRecord) {
            this.recordNotSelected = false;
        }
        this.defaultValue = this.selectedRecord;
        this.dispatchEvent(new FlowAttributeChangeEvent('recordId', this.selectedRecord));
    }

    openModalToAddRecord() {
        /*this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: this.objectApiName,
                actionName: 'new'
            },
            state: {
                nooverride: '1',
                useRecordTypeCheck: '1',
                navigationLocation: 'RELATED_LIST'
            }
        })*/
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    handleStatusChange(event) {

        let obj = event.detail;
        if(obj.status == 'FINISHED'){
            if(obj.outputVariables.length > 0){
                //console.log(obj.outputVariables);
                obj.outputVariables.forEach(ele =>{
                    if(ele.name == "createdRecordId" && ele.value != null){
                       // console.log(ele);
                        this.defaultValue = ele.value;
                        this.showSpinner = true;

                        this.fetchRecords();
                        return;
                    }
                })
            }
            this.showModal = false;
        }
    }

    resetSelectedRecord() {
        this.searchSentence = '';
        this.recordNotSelected = true;
        this.selectedRecord = null;
        this.selectedRecordName = null;
        this.listOfRecords = null;
        this.filteredListOfRecords = null;
        this.defaultValue = null;
        this.fetchRecords();
        window.setTimeout(() => {
            let element = this.refs.inputBox
            if (element) {
                element.focus()
            }
        }, 10)
        this.dispatchEvent(new FlowAttributeChangeEvent('recordId', null));
    }

    filterList(event) {
        this.showSpinner = true;
        this.searchSentence = event.target.value;
        this.fetchRecords();
    }
}
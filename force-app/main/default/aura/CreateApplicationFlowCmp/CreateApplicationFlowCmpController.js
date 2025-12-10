({
    
    handleOpenFlow: function(component, event, helper) {
        let flow = component.find("applicationFlow");
        flow.startFlow('ple__Application_ScreenFlow_Create_Application');
        component.set("v.showSpinner",false);
    },
    statusChange : function (component, event, helper) {
        //Check Flow Status
        if (event.getParam('status') === "FINISHED_SCREEN" || event.getParam('status') === "FINISHED") {
            let outputVariables = event.getParam('outputVariables')
            if(outputVariables && outputVariables.length > 0){
                //console.log(outputVariables);
                let obj = outputVariables.find(data=> data.name == "newCreatedRecordId")
                if(obj && obj.value){
                    let recordId = obj.value
                    var navEvt = $A.get("e.force:navigateToSObject");
                    navEvt.setParams({
                        "recordId": recordId,
                    });
                    navEvt.fire();
                }
            }
            //Show toast 
            helper.showToast('Success!','Saved successfully.','success');
        } else if (event.getParam('status') === "ERROR") {
            let errors = event.getParam('errors');
            helper.showToast('Error!',errors,'error');
        }
    },
    
    closeModel: function(component, event, helper) {
        component.set("v.isOpen", false);
        const navEvent = $A.get("e.force:navigateToList");
        navEvent.setParams({
            "listViewName": 'All',
            "scope": "ple__Application__c"
        });
        navEvent.fire(); 
    },   
})
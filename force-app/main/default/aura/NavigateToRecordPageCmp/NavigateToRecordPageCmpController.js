({
	invoke : function(component, event, helper) {
        let recordId = component.get("v.recordId");
        let navigate = $A.get("e.force:navigateToSObject");
        navigate.setParams({
            "recordId": recordId
        });
        navigate.fire();
    },
})
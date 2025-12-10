trigger ApplicationTrigger on Application__c (After insert, After Update) {
if(trigger.isAfter && trigger.isInsert){
        PulseObjectHandler.checkConditionForInsert(trigger.new);
    }
    if(trigger.isAfter && trigger.isUpdate){
        PulseObjectHandler.checkConditionForUpdate(trigger.newMap ,trigger.oldMap);
        PulseObjectHandler.UpdateWftOwner(trigger.new, trigger.oldMap);
    }
}
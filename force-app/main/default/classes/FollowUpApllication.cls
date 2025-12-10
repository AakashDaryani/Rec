public with sharing class FollowUpApllication {
    
    @AuraEnabled
    public static FilterValues getFilterValues(){
        if(Schema.sObjectType.Application__c.fields.OwnerId.isAccessible() && Schema.sObjectType.User.fields.Name.isAccessible()){
            List<AggregateResult> agrResultForOwner = [SELECT OwnerId, Owner.Name FROM Application__c WHERE OwnerId != null WITH SECURITY_ENFORCED GROUP BY OwnerId, Owner.Name];
            FilterValues filterValues = new FilterValues();
            if(!agrResultForOwner.isEmpty()){
                filterValues.userList = agrResultForOwner;
            }
            System.debug(filterValues);
            return filterValues;
        }
        return NULL;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<GetFieldListWrapper> getAllFields() {
        // Describe the Application object
        Map<String, String> pickListValues = new Map<String, String>();
        List<GetFieldListWrapper> fieldName = new List<GetFieldListWrapper>();
        Map<String, Schema.SObjectField> fieldMap = Application__c.sObjectType.getDescribe().fields.getMap();
        for(Schema.sObjectField objFields : fieldMap.values()){
            pickListValues = new Map<String, String>();
            String apiName = objFields.getDescribe().getName();
            String dataType = objFields.getDescribe().getType().name();
            if(dataType == Schema.DisplayType.Picklist.name()){
                for(Schema.PicklistEntry entry : fieldMap.get(apiName).getDescribe().getPicklistValues()){
                    pickListValues.put(entry.getLabel(), entry.getValue());
                }
            }
            if(!apiName.ContainsIgnoreCase('Address')){
                GetFieldListWrapper GFLW = new GetFieldListWrapper(apiName, pickListValues);
                fieldName.add	(GFLW);
                System.debug('fieldName : '+fieldName);
            }
        }

        return fieldName;
    }
    
    @AuraEnabled
    public static List<Application__c> getApplications(String ownerId, Boolean followUps, String orderBy, String stage, String applicationType) {
        System.debug('ownerId : '+ownerId);
        System.debug('followUps : '+followUps);
        System.debug('orderBy : '+orderBy);
        System.debug('stage : '+stage);
        System.debug('applicationType : '+applicationType);
        // Check if the current user has access to the necessary fields
        if (Schema.sObjectType.Application__c.fields.Id.isAccessible() && 
            Schema.sObjectType.Application__c.fields.Name.isAccessible() && 
            Schema.sObjectType.Application__c.fields.Follow_Up__c.isAccessible() && 
            Schema.sObjectType.Application__c.fields.Stage__c.isAccessible() && 
            Schema.sObjectType.Application__c.fields.CreatedDate.isAccessible() && 
            Schema.sObjectType.Application__c.fields.OwnerId.isAccessible() && 
            Schema.sObjectType.Application__c.fields.Application_Type__c.isAccessible()) {
                
                // Initialize the base query
                String query = 'SELECT ID, Name, Follow_Up__c, Stage__c,ple__Application_Type__c, CreatedDate FROM Application__c ';
                List<String> queryConditions = new List<String>();
                
                // Add conditions based on parameters
                if (!String.isBlank(ownerId) && ownerId != 'All') {
                    queryConditions.add('OwnerId = :ownerId');
                }
                if (!String.isBlank(stage)) {
                    queryConditions.add('Stage__c = :stage');
                }
                if (!String.isBlank(applicationType)) {
                    queryConditions.add('Application_Type__c = :applicationType');
                }
                if (followUps == FALSE) {
                    queryConditions.add('Follow_Up__c <= TODAY');
                }
                
                // Construct the query string by joining all conditions
                if (!queryConditions.isEmpty()) {
                    query += ' WHERE ' + String.join(queryConditions, ' AND ');
                }
                
                // Add ORDER BY clause if provided
                if (!String.isBlank(orderBy)) {
                    query += ' ORDER BY ' + String.escapeSingleQuotes(orderBy);
                    if (orderBy.endsWith('DESC')) {
                        query += ' NULLS LAST ';
                    }
                }
                
                // Perform the query with bind variables
                System.debug('Query: ' + query);
                List<Application__c> applicationList = Database.query(query);
                System.debug('applicationList : '+applicationList);
                
                // Return the result if not empty
                if (!applicationList.isEmpty()) {
                    return applicationList;
                }
            }
        return NULL;
    }
    
    
    
    @AuraEnabled
    public static void updateRecords(String applications){
        try{
            System.debug(applications);
            if(!String.isBlank(applications)){
                List<Application__c> applicationList = (List<Application__c>)JSON.deserialize(applications, List<Application__c>.class);
                if(Schema.sObjectType.Application__c.isUpdateable() && !applicationList.isEmpty()){
                    update applicationList;
                }
            }   
        }catch(Exception ex){
            System.debug(ex.getMessage());
            throw new AuraHandledException(ex.getMessage());
        }
    }
    
    public class FilterValues{
        @AuraEnabled
        public List<AggregateResult> userList;
        @AuraEnabled
        public String userTimeZone = String.valueOf(UserInfo.getTimeZone());
    }
    
    public class GetFieldListWrapper{
        @AuraEnabled public String apiName{get;set;}
        @AuraEnabled public Map<String, String> pickListValues{get;set;}
        
        public GetFieldListWrapper(String apiName, Map<String, String> pickListValues){
            this.apiName = apiName;
            this.pickListValues = pickListValues;
        }
    }
}
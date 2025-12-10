@isTest
public class FollowUpApplicationTest {
    @testSetup
    public static void SetTestData(){
        String stg = ''; 
        String appType = ''; 
        //fetch the required field api name in a string variable to handle the nameSpace issues 
        Map<String, Schema.SObjectField> objFieldMap = new Map<String, Schema.SObjectField>();
        objFieldMap = Application__c.SObjectType.getDescribe().fields.getMap();
        if(objFieldMap != null && objFieldMap.size() > 0){
            for(String field : objFieldMap.keySet()){
                System.debug('field : '+field);
                if(field.containsIgnoreCase('Stage')){
                    stg = field;
                }else if(field.containsIgnoreCase('Application_Type')){
                    appType = field; 
                }
            }
        }
        
        //Fetch the stage field picklist values
        List<Schema.PicklistEntry> stagePicklistValue = objFieldMap.get(stg).getDescribe().getPicklistValues();
        List<Schema.PicklistEntry> appTypePicklistValue = objFieldMap.get(appType).getDescribe().getPicklistValues();
        System.debug('stagePicklistValue : '+stagePicklistValue);
        System.debug('appTypePicklistValue : '+appTypePicklistValue);
        
        String stageValue = '';
        String appTypeValue = '';
        if(!stagePicklistValue.isEmpty() && !appTypePicklistValue.isEmpty()){
            stageValue = stagePicklistValue[0].getLabel();
            appTypeValue = appTypePicklistValue[0].getLabel();
        }
        Contact con = new Contact(LastName = 'Test Contact');
        INSERT con;
        Application__c app = new Application__c(Name = 'TestApp', Stage__c = stageValue, Application_Type__c = appTypeValue, Applicant__c = con.Id, Follow_Up__c = Date.newInstance(2022, 7, 29));
        INSERT app;
        System.debug('App : '+app);
    }
    
    @isTest
    public static void PositiveFunction(){
        Application__c app = [SELECT Id, Name, Stage__c, Application_Type__c, OwnerId, Applicant__c, Follow_Up__c FROM Application__c LIMIT 1];
        
        User testUser = new User(
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' WITH SECURITY_ENFORCED].Id,
            LastName = 'Test',
            Email = 'testuser@example.com',
            Username = 'testuser_123@example.com',
            Alias = 'tuser',
            TimeZoneSidKey = 'America/Los_Angeles',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US'
        );
        INSERT testUser;
        
        PermissionSet permSet = [SELECT Id FROM PermissionSet WHERE Name = 'Recruiting' WITH SECURITY_ENFORCED];
        
        PermissionSetAssignment permSetAssign = new PermissionSetAssignment(
            AssigneeId = testUser.Id,
            PermissionSetId = permSet.Id
        );
        INSERT permSetAssign;
        System.runAs(testUser) {
            test.StartTest();
            List<Application__c> appList = FollowUpApllication.getApplications(app.OwnerId, False, 'Name DESC', app.Stage__c, app.Application_Type__c);
            System.assertNotEquals(null, appList, 'Application Record Value should not be null');
            
            List<Application__c> appList2 = FollowUpApllication.getApplications('', False, 'Name DESC', app.Stage__c, app.Application_Type__c);
            System.assertNotEquals(null, appList2, 'Application Record Value should not be null');
            
            List<Application__c> appList3 = FollowUpApllication.getApplications('', False, 'Name DESC', '', app.Application_Type__c);
            System.assertNotEquals(null, appList3, 'Application Record Value should not be null');
            
            List<Application__c> appList4 = FollowUpApllication.getApplications('', False, 'Name DESC', '', '');
            System.assertNotEquals(null, appList4, 'Application Record Value should not be null');
            
            String applications = JSON.serialize(appList4);
            FollowUpApllication.updateRecords(applications);
            
            FollowUpApllication.FilterValues fValue = FollowUpApllication.getFilterValues();
            System.assertNotEquals(null,fValue,'Wrapper Value should not be null');
            
            List<FollowUpApllication.GetFieldListWrapper> fields = FollowUpApllication.getAllFields();
            System.assertNotEquals(null,fields,'Wrapper Value should not be null');
            test.StopTest();
        }
        
    }
}
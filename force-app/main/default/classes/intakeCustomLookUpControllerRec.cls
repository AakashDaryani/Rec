/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 10-18-2024
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class intakeCustomLookUpControllerRec {
    @AuraEnabled
    public static List<Sobject> fetchRecords(String objectName, String fieldName, String searchTerm, String recordTypeId, String defaultId,String filter){
        System.debug('filter'+filter);
        String query = '';
        if(String.isNotBlank(objectName) && String.isNotBlank(fieldName)){
            objectName = String.escapeSingleQuotes(objectName);
            fieldName = String.escapeSingleQuotes(fieldName);
            query = 'SELECT Id, ' + fieldName + ' FROM ' + objectName + ' WHERE Id != NULL';
            
        }
        List<String> conditions = new List<String>();
        conditions.add(query);
        if (String.isNotBlank(searchTerm)) {
            searchTerm = String.escapeSingleQuotes(searchTerm);
            searchTerm = '%' + searchTerm + '%';
            conditions.add(' AND '+fieldName + ' LIKE :searchTerm');
        }

        if (String.isNotBlank(defaultId)) {
            defaultId = String.escapeSingleQuotes(defaultId);
            conditions.add(' AND Id = :defaultId');
        }
        if (String.isNotBlank(recordTypeId)) {
            recordTypeId = String.escapeSingleQuotes(recordTypeId);
            conditions.add(' AND RecordTypeId = :recordTypeId');
        }
        if (String.isNotBlank(filter)) {
            //filter = String.escapeSingleQuotes(filter);
            conditions.add(' AND ' + filter);
        }
        conditions.add(' LIMIT 5');
        
        String queryString = String.join(conditions,'');
        System.debug('queryString : '+queryString);
        List<Sobject> sObj = new List<Sobject>();
        sObj = Database.query(queryString);
        return sObj;
    }
    
     @AuraEnabled(cacheable = true)
    public static String getFlowName(String label){
        String flowName;
        try{
            flowName = System.Label.get('',label);
        }catch(Exception error){
            if(label == 'Add_Related_Contact_Flow'){
                flowName = 'ple__Contact_Screenflow_CreateOtherContact';
            }else{
                flowName = 'ple__Referral_ScreenFlow_Create_Referral';
            }
        }
        return flowName;
    }
}
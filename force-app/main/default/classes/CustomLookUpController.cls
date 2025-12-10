public with sharing class CustomLookUpController {
    @AuraEnabled
    public static List<Sobject> fetchRecords(String objectName, String fieldName, String searchTerm, String recordTypeId, String defaultId){
        objectName = String.escapeSingleQuotes(objectName);
        fieldName = String.escapeSingleQuotes(fieldName);
        searchTerm = String.escapeSingleQuotes(searchTerm);
        recordTypeId = String.escapeSingleQuotes(recordTypeId);
        defaultId = String.escapeSingleQuotes(defaultId);
        String query = '';
        if(String.isNotBlank(objectName) && String.isNotBlank(fieldName)){
            if(Schema.getGlobalDescribe().get(objectName).getDescribe().isAccessible() && Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap().get(fieldName).getDescribe().isAccessible()){
                query = 'SELECT Id, ' + fieldName + ' FROM ' + objectName + ' WHERE Id != NULL';
            }
        }
        List<String> conditions = new List<String>();
        conditions.add(query);
        if (String.isNotBlank(searchTerm)) {
            conditions.add(' AND '+fieldName + ' LIKE :searchTerm');
        }
        if (String.isNotBlank(defaultId)) {
            conditions.add(' AND Id = :defaultId');
        }
        if (String.isNotBlank(recordTypeId)) {
            conditions.add(' AND RecordTypeId = :recordTypeId');
        }
        conditions.add(' LIMIT 5');
        
        String queryString = String.join(conditions,'');
        List<Sobject> sObj = new List<Sobject>();
        sObj = Database.query(queryString);
        return sObj;
    }
}
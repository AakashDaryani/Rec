@isTest
public class intakeCustomLookUpControllerRecTest {
    @testSetup
    public static void SetTestData(){
        Contact con = new Contact(LastName = 'Test Contact');
        INSERT con;
    }
    
    @isTest
    public static void PositiveFunction(){
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
        insert testUser;
        
        PermissionSet permSet = [SELECT Id FROM PermissionSet WHERE Name = 'Recruiting'];
        
        PermissionSetAssignment permSetAssign = new PermissionSetAssignment(
            AssigneeId = testUser.Id,
            PermissionSetId = permSet.Id
        );
        insert permSetAssign;
        //System.runAs(testUser) {
            Contact con = [SELECT Id, LastName FROM Contact WHERE LastName = 'Test Contact' WITH SECURITY_ENFORCED LIMIT 1];
            test.StartTest();
            List<Sobject> sObjList = intakeCustomLookUpControllerRec.fetchRecords('Contact', 'LastName', 'Test Contact', '', con.Id,'');
            System.assertEquals(1, sObjList.size(), 'no one Contact record matching the searcTerm');
            intakeCustomLookUpControllerRec.getFlowName('Create_Referral_Button_Home_Flow');
            test.StopTest();
        //}
    }
}
namespace test.app.srv.s4;

using {
  cuid,
  managed
} from '@sap/cds/common';


@impl : './sample4.js'
@path : '/sample4'
service Sample4Service {


  entity People : cuid, managed {
    Name : String(255);
    Age  : Integer;
  } actions {
    // action level
    @cds.rate.limit : {
      points   : 30,
      duration : 5,
    }
    function getName() returns String;
  }


  // action level
  @cds.rate.limit : {
    points   : 31,
    duration : 5,
  }
  function getName(PeopleID : UUID) returns String;

}

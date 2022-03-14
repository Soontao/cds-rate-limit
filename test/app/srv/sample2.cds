namespace test.app.srv.s2;

using {
  cuid,
  managed
} from '@sap/cds/common';

@requires       : 'authenticated-user'
@path           : '/sample2'
@cds.rate.limit : {
  points   : 20,
  duration : 5,
}
service Sample2Service {

  entity People : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }

}

namespace test.app.srv.s5;

using {
  cuid,
  managed
} from '@sap/cds/common';

@requires       : 'authenticated-user'
@path           : '/sample5'
@cds.rate.limit : {
  points   : 5,
  duration : 1,
}
service SampleService {

  entity People : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }

}

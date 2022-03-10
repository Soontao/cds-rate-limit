namespace test.app.srv.s1;


using {
  cuid,
  managed
} from '@sap/cds/common';

// global level

@path : '/sample'
service SampleService {

  entity People : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }

  entity OtherEntity : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }

}

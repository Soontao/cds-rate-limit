using {
  cuid,
  managed
} from '@sap/cds/common';


@path : '/sample'
service SampleService {

  entity People : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }

}

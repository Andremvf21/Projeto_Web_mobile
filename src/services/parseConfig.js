import 'react-native-get-random-values';
import Parse from 'parse/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Parse.setAsyncStorage(AsyncStorage);

Parse.initialize(
  'gpcMCKTnEkH9GXrwDyKTb7YpfYyPc1IzAGAGVVbi',   // cole aqui
  'OCtIqfHUqsGFsgnVcqotwAKhxmaba3sLRU2Z7nM0'    // cole aqui
);

Parse.serverURL = 'https://parseapi.back4app.com/';

export default Parse;
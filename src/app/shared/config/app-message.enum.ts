export enum AppMessage {
      // Validation Messages
      U0001 = 'Username is required',
      U0002 = 'Password is requied',
      U0003 = 'Minimum 6 digits required',
      U0004 = 'Not authorised',
      U0005 = 'Incorrect credentials or you do not have the rights to access the Entertainment Admin Portal',
      U0006 = 'Something went wrong, please try again later',
      U0026 = 'Not authorised',
      U0027 = 'Dog added successfully',
      U0028 = 'Are you sure you want to remove this dog\'s information?',
      U0029 = 'Dog removed successfully',
      U0030 = 'Dog\'s information updated successfully',

      // Error Messages
      ER001 = 'Something went wrong, please try again later',
      ER002 = 'Data Not Available.',
      ER003 = 'No result found.',
      ER004 = 'We can\'t find any item matching your search.',
      ER005 = 'Your session has expired.',
      ER006 = 'Your are not authorised.',

      // Confirm Box Message
      CF01H = 'Would you like to enable offline Mode?',
      CF01M = 'Please note this would required extra storage in your local device and give you the ability to access directory even when you are offline.',
      CF02H = 'Would you like to disable offline Mode?',
      CF02M = 'You will not be able to access directory from your local device when you are offline.',
      OF001 = 'Please check your network connection and try again later'
}

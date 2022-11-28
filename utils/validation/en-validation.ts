export const enValidation = {
  email: {
    presence: {
      message: '^Please enter an email address',
    },
    email: {
      message: '^Please enter a valid email address',
    },
  },
  emailConfirmation: {
    presence: {
      message: '^Please enter a valid confirmation email address',
    },
    email: {
      message: '^Please enter a valid confirmation email address',
    },
  },
  phoneNumber: {
    presence: {
      message: '^Phone number field can not be empty',
    },
    length: {
      minimum: 9,
      message: '^Your Phone number must be at least 9 numbers',
    },
  },
  orgEmail: {
    presence: {
      message: '^Please enter a contact email address',
    },
    email: {
      message: '^Please enter a valid contact email address',
    },
  },
  password: {
    presence: {
      message: '^Please enter a password',
    },
    length: {
      minimum: 6,
      message: '^Your password must be at least 6 characters',
    },
  },
  passwordN: {
    presence: {
      message: '^Please enter New Password',
    },
    length: {
      minimum: 6,
      message: '^Your New Password must be at least 6 characters',
    },
  },
  passwordC: {
    presence: {
      message: '^Please Re-enter New Password',
    },
    length: {
      minimum: 6,
      message: '^Your Password must be at least 6 characters',
    },
  },
  cPassword: {
    presence: {
      message: '^Please enter a confirm password',
    },
    length: {
      minimum: 6,
      message: '^Your password must be at least 6 characters',
    },
  },
  fullname: {
    presence: {
      message: '^Please enter a full name',
    },
    length: {
      minimum: 4,
      message: '^Your full name must be at least 4 characters',
    },
  },
  companyName: {
    presence: {
      message: '^Please enter a Company name',
    },
    length: {
      minimum: 4,
      message: '^Your Company name must be at least 4 characters',
    },
  },
  orgfullName: {
    presence: {
      message: '^Please enter a contact name',
    },
    length: {
      minimum: 4,
      message: '^Contact Name must be at least 4 characters',
    },
  },
  orgPhoneNo: {
    presence: {
      message: '^Please enter a contact phone number',
    },
    length: {
      minimum: 8,
      message: '^Contact Phone must be at least 8 characters',
    },
  },
  location_label: {
    presence: {
      message: '^Please enter a Location',
    },
  },

  username: {
    presence: {
      message: '^Please enter a user name',
    },
    length: {
      minimum: 4,
      message: '^Your full name must be at least 4 characters',
    },
  },
  confirmpass: {
    presence: {
      message: '^Please RE-enter the Password',
    },
    length: {
      minimum: 6,
      message: '^Your Re-enter Password must be at least 6 characters',
    },
  },
  twitterUsername: {
    presence: {
      message: '^Please Enter a Twitter Username',
    },
  },
  instagramUsername: {
    presence: {
      message: '^Please Enter a Instagram Username',
    },
  },
  twitterHandler: {
    presence: {
      message: '^Please enter your twitter Handler',
    },
  },
  instagramHandler: {
    presence: {
      message: '^Please enter your Instagram Handler',
    },
  },
  twitterTitle: {
    presence: {
      message: '^Please enter your twitter Title',
    },
  },
  instagramTitle: {
    presence: {
      message: '^Please enter your Instagram Title',
    },
  },
  comments: {
    presence: {
      message: '^This filed Required!',
    },
  },
  bio: {
    presence: {
      message: '^This filed Required!',
    },
  },
  title: {
    presence: {
      message: '^This filed Required!',
    },
  },
  website: {
    presence: {
      message: '^This filed Required!',
    },
    url: {
      message: '^Please enter a valid url starting with http/https',
    },
  },
};

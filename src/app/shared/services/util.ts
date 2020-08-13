export class Util {
/**
   * Format the date to the format of MM-DD-YYYY to send it to backend
   * @param dateString : date as string/date
   * @param separator : sparator e.g. -/
   */
  formatDate(dateString: any, separator: string = '-', dbFormat: Boolean = true, appendTime: Boolean = false) {
    const value = dateString ? new Date(dateString) : '';
    if (!value) {
      return '';
    }
    const curr_date = value.getDate() < 10 ? '0' + value.getDate() : value.getDate();
    const mon = value.getMonth() + 1; // Months are zero based
    const curr_month = mon < 10 ? '0' + mon : mon;
    const curr_year = value.getFullYear();
    let modifiedDate  = '';
    let time = value.getHours() + ':' + value.getMinutes() + ':' + value.getSeconds();
    if (dbFormat) {
      modifiedDate = curr_year + separator + curr_month + separator + curr_date + (appendTime ? ' ' + time : '');
    } else {
      modifiedDate = curr_month + separator + curr_date + separator + curr_year;
    }
    return modifiedDate;
  }

  getAge(dateString: string) {
    let now = new Date();
    let today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
  
    let yearNow = now.getFullYear();
    let monthNow = now.getMonth();
    let dateNow = now.getDate();
  
    let dob = new Date(parseInt(dateString.substring(6,10)),
                       parseInt(dateString.substring(0,2))-1,                   
                       parseInt(dateString.substring(3,5))
                       );
  
    let yearDob = dob.getFullYear();
    let monthDob = dob.getMonth();
    let dateDob = dob.getDate();
    let age: any = {
      years: '',
      months: '',
      days: ''
    };
    let ageString = "";
    let yearString = "";
    let monthString = "";
    let dayString = "";
    let monthAge = 0;
    let dateAge = 0;
  
  
    let yearAge = yearNow - yearDob;
  
    if (monthNow >= monthDob)
      monthAge = monthNow - monthDob;
    else {
      yearAge--;
      monthAge = 12 + monthNow -monthDob;
    }
  
    if (dateNow >= dateDob)
      dateAge = dateNow - dateDob;
    else {
      monthAge--;
      dateAge = 31 + dateNow - dateDob;
  
      if (monthAge < 0) {
        monthAge = 11;
        yearAge--;
      }
    }
  
    age = {
        years: yearAge,
        months: monthAge,
        days: dateAge
      };
  
    if ( age.years > 1 ) yearString = " yr";
    else yearString = " year";
    if ( age.months> 1 ) monthString = " months";
    else monthString = " month";
    if ( age.days > 1 ) dayString = " days";
    else dayString = " day";
  
  
    if ( (age.years > 0) && (age.months > 0) && (age.days > 0) )
      ageString = age.years + yearString + " " + age.months + monthString;// + ", and " + age.days + dayString + " old.";
    else if ( (age.years == 0) && (age.months == 0) && (age.days > 0) )
      ageString = "Only " + age.days + dayString;// + " old!";
    else if ( (age.years > 0) && (age.months == 0) && (age.days == 0) )
      ageString = age.years + yearString;// + " old. Happy Birthday!!";
    else if ( (age.years > 0) && (age.months > 0) && (age.days == 0) )
      ageString = age.years + yearString;// + " and " + age.months + monthString + " old.";
    else if ( (age.years == 0) && (age.months > 0) && (age.days > 0) )
      ageString = age.months + monthString;// + " and " + age.days + dayString + " old.";
    else if ( (age.years > 0) && (age.months == 0) && (age.days > 0) )
      ageString = age.years + yearString;// + " and " + age.days + dayString + " old.";
    else if ( (age.years == 0) && (age.months > 0) && (age.days == 0) )
      ageString = age.months + monthString;// + " old.";
    else ageString = "Oops! Could not calculate age!";
  
    return ageString;
  }

  
  

}

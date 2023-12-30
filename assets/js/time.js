const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
let style = params.style; // get value of "style" param
document.body.classList.add(style);

let now = moment().locale('en-gb');
// let now = moment('2023-01-01 00:00:01', 'YYYY-MM-DD HH:mm:ss').locale('en-gb'); // TESTING ONLY

let starttimes, jamaat, today;

async function fetchStart(year) {
  let url = `././data/${year}.json`;
  let response = await fetch(url);

  if (response.status === 200) {
    let data = await response.text();
    starttimes = JSON.parse(data);
  }
}

async function fetchJamaat(year) {
  let url = `././data/jamaat/${year}.json`;
  let response = await fetch(url);

  if (response.status === 200) {
    let data = await response.text();
    jamaat = JSON.parse(data);
  }
}

async function timeCalc() {
  now = moment().locale('en-gb');
  // now = now.locale('en-gb').add(1, 'second'); // TESTING ONLY
  nowminus = moment(now).subtract(10, "minutes").locale('en-gb'); // 10 minutes before now is used to show active Jama'ah time for 10 minutes from the start of Iqamah
  nowminus20 = moment(now).subtract(20, "minutes").locale('en-gb'); // 20 minutes version

  // refresh data every day
  if (today != now.locale('en-gb').format('YYYY-MM-DD ')) {
    today = now.locale('en-gb').format('YYYY-MM-DD ');
    const resultS = await fetchStart(now.format('YYYY'));
    const resultJ = await fetchJamaat(now.format('YYYY'));
  }

  let tomorrow = moment(now).locale('en-gb').add(1, 'day').format('YYYY-MM-DD '); // tomorrow is used for Fajr after Isha

  // find today's start times from the array
  let timestoday = starttimes.times.filter(obj => {
    return obj.day === now.format('MMM DD ddd')
  });
  if(timestoday.length != 0) { timestoday = timestoday[0].times; } 

  // find today's Jama'at times from the array
  let jamaattoday = jamaat.filter(obj => {
    return obj.date === now.format('YYYY-MM-DD')
  });
  
  if(jamaattoday.length != 0) { jamaattoday = jamaattoday[0]; } 

  // find tomorrow's Fajr time to use after Isha
  let nextfajr = starttimes.times.filter(obj => {
    return obj.day == moment(now).locale('en-gb').add(1, 'day').format('MMM DD ddd')
  });
  if(nextfajr.length != 0) { nextfajr = nextfajr[0].times.fajr } else { nextfajr = timestoday.fajr }

  // find tomorrow's Fajr Iqamah time to use after Isha
  let nextfajriqamah = jamaat.filter(obj => {
    return obj.date == moment(now).locale('en-gb').add(1, 'day').format('YYYY-MM-DD')
  });
  if(nextfajriqamah.length != 0) { nextfajriqamah = nextfajriqamah[0].fajr } else { nextfajriqamah = jamaattoday.fajr }
  let nextfajrmoment = moment(tomorrow + nextfajr, 'YYYY-MM-DD HH:mm');

  if (typeof(jamaattoday.maghrib) === "undefined") { jamaattoday.maghrib = timestoday.maghrib.trim() } // if there's no Maghrib Jama'at time, use the start time

  let event = [
    {
      "slug": "fajr",
      "en": "Fajr",
      "ar": "الفجر",
      "start": timestoday.fajr.trim(),
      "iqamah": jamaattoday.fajr
    }, {
      "slug": "sunrise",
      "en": "Sunrise",
      "ar": "شروق",
      "start": timestoday.sunrise.trim()
    }, {
      "slug": "dhuhr",
      "en": "Dhuhr",
      "ar": "الظهر",
      "start": timestoday.dhuhr.trim(),
      "iqamah": jamaattoday.dhuhr
    }, {
      "slug": "asr",
      "en": "Asr",
      "ar": "العصر",
      "start": timestoday.asr.trim(),
      "iqamah": jamaattoday.asr
    }, {
      "slug": "maghrib",
      "en": "Maghrib",
      "ar": "المغرب",
      "start": timestoday.maghrib.trim(),
      "iqamah": jamaattoday.maghrib
    }, {
      "slug": "isha",
      "en": "Isha",
      "ar": "العشاء",
      "start": timestoday.isha.trim(),
      "iqamah": jamaattoday.isha
    }, {
      "slug": "fajr",
      "en": "Fajr",
      "ar": "الفجر",
      "start": nextfajr.trim(),
      "iqamah": nextfajriqamah,
    }, {
      "slug": "jumuah",
      "en": "Jumu'ah",
      "ar": "الجمعة",
      "start": jamaattoday.jumuah1,
      "iqamah": jamaattoday.jumuah2
    }
  ];

  let fajr = '',
  sunrise = '',
  dhuhr = '',
  asr = '',
  maghrib = '',
  isha = '',
  nextevent = 0,
  nexttime = '',
  iqamah = 0,
  salah = 0,
  event1name = 'Start | بداية',
  event1time = '',
  event2name = 'Iqamah | إقامة',
  event2time = '';

  let day = moment(now).weekday(); // 4 = Friday
  let fajrmoment = moment(today + timestoday.fajr, 'YYYY-MM-DD HH:mm');
  let sunrisemoment = moment(today + timestoday.sunrise, 'YYYY-MM-DD HH:mm');
  let dhuhrmoment = moment(today + timestoday.dhuhr, 'YYYY-MM-DD HH:mm');
  let asrmoment = moment(today + timestoday.asr, 'YYYY-MM-DD HH:mm');
  let maghribmoment = moment(today + timestoday.maghrib, 'YYYY-MM-DD HH:mm');
  let ishamoment = moment(today + timestoday.isha, 'YYYY-MM-DD HH:mm');

  let fajriqamahmoment = moment(today + jamaattoday.fajr, 'YYYY-MM-DD HH:mm');
  let dhuhriqamahmoment, jumuah1iqamahmoment, jumuah2iqamahmoment, jumuahdhuhr;
  if (day === 4) {
    jumuah1iqamahmoment = moment(today + jamaattoday.jumuah1, 'YYYY-MM-DD HH:mm');
    jumuah2iqamahmoment = moment(today + jamaattoday.jumuah2, 'YYYY-MM-DD HH:mm');
    jumuahdhuhr = jamaattoday.jumuah1;
    dhuhriqamahmoment = jumuah1iqamahmoment;
    event[2].iqamah = jumuahdhuhr;
  } else {
    dhuhriqamahmoment = moment(today + jamaattoday.dhuhr, 'YYYY-MM-DD HH:mm');
    jumuahdhuhr = jamaattoday.dhuhr.trim();
  }
  let asriqamahmoment = moment(today + jamaattoday.asr, 'YYYY-MM-DD HH:mm');
  let maghribiqamahmoment = moment(today + jamaattoday.maghrib, 'YYYY-MM-DD HH:mm');
  let ishaiqamahmoment = moment(today + jamaattoday.isha, 'YYYY-MM-DD HH:mm');

  if (now < fajrmoment) { nextevent = 0, iqamah = 0, nexttime = fajrmoment; } else // before Fajr
  
    // Fajr start
    if (now < fajriqamahmoment) { fajr = ' active', nextevent = 0, iqamah = 1, nexttime = fajriqamahmoment; } else // Fajr starts, before Iqamah
      if (nowminus < fajriqamahmoment) { fajr = ' active', nextevent = 0, iqamah = 0, salah = 1, nexttime = sunrisemoment; } else // Fajr Iqamah starts and shows for 10 minutes
        if (now < sunrisemoment) { fajr = ' active', nextevent = 2, iqamah = 0, salah = 0, nexttime = sunrisemoment; } else // after Fajr Salah & before Sunrise

          // Sunrise start
          if (now < dhuhrmoment) { sunrise = ' active', nextevent = 2, iqamah = 0, salah = 0, nexttime = dhuhrmoment; } else // after Sunrise & before Dhuhr

            // Dhuhr start
            if (now < jumuah1iqamahmoment) { dhuhr = ' active'; nextevent = 7, iqamah = 1, nexttime = jumuah1iqamahmoment, event1name = "Jumu'ah 1", event2name = "Jumu'ah 2"; } else // Dhuhr starts, before Jumu'ah 1 Iqamah
            if (now < dhuhriqamahmoment) { dhuhr = ' active'; nextevent = 2, iqamah = 1, nexttime = dhuhriqamahmoment; } else // Dhuhr starts, before Iqamah
              if (nowminus < jumuah1iqamahmoment) { dhuhr = ' active'; nextevent = 7, iqamah = 0, salah = 1, nexttime = jumuah2iqamahmoment, event1name = "Jumu'ah 1", event2name = "Jumu'ah 2"; } else // Jumu'ah 1 Iqamah starts and shows for 10 minutes
              if (nowminus < dhuhriqamahmoment) { dhuhr = ' active'; nextevent = 2, iqamah = 0, salah = 1, nexttime = asrmoment; } else // Dhuhr Iqamah starts and shows for 10 minutes
                if (now < jumuah2iqamahmoment) { dhuhr = ' active'; nextevent = 7, iqamah = 1, nexttime = jumuah2iqamahmoment, event1name = "Jumu'ah 1", event2name = "Jumu'ah 2"; } else // Jumu'ah 1 finished, before Jumu'ah 2 Iqamah
                if (nowminus < jumuah2iqamahmoment) { dhuhr = ' active'; nextevent = 7, iqamah = 0, salah = 1, nexttime = asrmoment, event1name = "Jumu'ah 1", event2name = "Jumu'ah 2"; } else // Jumu'ah 2 Iqamah starts and shows for 10 minutes
                if (now < asrmoment) { dhuhr = ' active'; nextevent = 3, iqamah = 0, salah = 0, nexttime = asrmoment; } else // after Dhuhr Salah & before Asr

                  // Asr start
                  if (now < asriqamahmoment) { asr = ' active'; nextevent = 3, iqamah = 1, nexttime = asriqamahmoment; } else // Asr starts, before Iqamah
                    if (nowminus < asriqamahmoment) { asr = ' active'; nextevent = 3, iqamah = 0, salah = 1, nexttime = maghribmoment; } else // Asr Iqamah starts and shows for 10 minutes
                      if (now < maghribmoment) { asr = ' active'; nextevent = 4, iqamah = 0, salah = 0, nexttime = maghribmoment;  } else // after Asr Salah & before Maghrib

                  // Maghrib start
                  if (now < maghribiqamahmoment) { maghrib = ' active'; nextevent = 4, iqamah = 1, nexttime = maghribiqamahmoment; } else // Maghrib starts, before Iqamah (won't fire if same time)
                    if (nowminus < maghribiqamahmoment) { maghrib = ' active'; nextevent = 4, iqamah = 0, salah = 1, nexttime = ishamoment; } else // Maghrib starts and shows for 10 minutes
                      if (now < ishamoment) { maghrib = ' active'; nextevent = 5, iqamah = 0, salah = 0, nexttime = ishamoment; } else // after Maghrib Salah & before Isha

                        // Isha start
                        if (now < ishaiqamahmoment) { isha = ' active'; nextevent = 5, iqamah = 1, nexttime = ishaiqamahmoment; } else // Isha starts, before Iqamah
                          if (nowminus20 < ishaiqamahmoment) { isha = ' active'; nextevent = 5, iqamah = 0, salah = 1, nexttime = nextfajrmoment; } else // Isha starts and shows for 10 minutes
                            if (now < nextfajrmoment) { isha = ' active'; nextevent = 6, iqamah = 0, salah = 0, nexttime = nextfajrmoment; } else { console.log('no match'); }

  // an override for showing Sunrise as the next countdown on the sidebar, while the event times are of Dhuhr
  let nextmoment = nextevent;
  if (nexttime === sunrisemoment) {nextmoment = 1}
  
  // work out time remaining and upcoming event times for the sidebar
  let timetogo = moment.duration(nexttime.diff(now));
  event1time = event[nextevent].start, event2time = event[nextevent].iqamah;

  let clockspace = `<span id="hijri">${now.format('iD iMMMM iYYYY')}</span><br />
  <span id="date">${now.format('dddd LL')}</span>
  <div id="clockdiv"><span id="now">${now.format('LTS')}</span></div>`;

  let nextspace = `<h2>Time to <span id="next">${event[nextmoment].en}</span></h2>
  <div id="timediv">
    <span id="hours">${timetogo.hours().toLocaleString('en-gb',{minimumIntegerDigits:2})}</span>:<span id="minutes">${timetogo.minutes().toLocaleString('en-gb',{minimumIntegerDigits:2})}</span>:<span id="seconds">${timetogo.seconds().toLocaleString('en-gb',{minimumIntegerDigits:2})}</span>
  </div>`;

  let salahspace = `<h2>صلاة ${event[nextevent].ar} جماعة</h2>
  <h1 id="timediv">
    ${event[nextevent].en} Jama'ah
  </h1>`;

  let eventspace = `<h2><span id="nextar">${event[nextevent].en} time | وقت ${event[nextevent].ar}</span></h2>
  <span class="prayer">
      <span class="time">${event1time}</span>
      <span class="event">${event1name}</span>
  </span><span class="prayer">
      <span class="time">${event2time}</span>
      <span class="event">${event2name}</span>
  </span>`;

  let sidebar = clockspace + nextspace + eventspace;
  if (salah === 1) { sidebar = clockspace + salahspace; }

  let prayerbar = `<span class='prayer${fajr}'>
      <span class='start'>${timestoday.fajr.trim()}</span>
      <span class='event'>${event[0].en} | ${event[0].ar}</span>
      <span class='iqamah'>${jamaattoday.fajr.trim()}</span>
    </span><span class='prayer${sunrise}'>
      <span class='start'>${timestoday.sunrise.trim()}</span>
      <span class='event'>${event[1].en} | ${event[1].ar}</span>
      <span class='iqamah'>--</span>
    </span><span class='prayer${dhuhr}'>
      <span class='start'>${timestoday.dhuhr.trim()}</span>
      <span class='event'>${event[2].en} | ${event[2].ar}</span>
      <span class='iqamah'>${jumuahdhuhr}</span>
    </span><span class='prayer${asr}'>
      <span class='start'>${timestoday.asr.trim()}</span>
      <span class='event'>${event[3].en} | ${event[3].ar}</span>
      <span class='iqamah'>${jamaattoday.asr.trim()}</span>
    </span><span class='prayer${maghrib}'>
      <span class='start'>${timestoday.maghrib.trim()}</span>
      <span class='event'>${event[4].en} | ${event[4].ar}</span>
      <span class='iqamah'>${maghribiqamahmoment.hours().toLocaleString('en-gb',{minimumIntegerDigits:2})}:${maghribiqamahmoment.minutes().toLocaleString('en-gb',{minimumIntegerDigits:2})}</span>
    </span><span class='prayer${isha}'>
      <span class='start'>${timestoday.isha.trim()}</span>
      <span class='event'>${event[5].en} | ${event[5].ar}</span>
      <span class='iqamah'>${jamaattoday.isha.trim()}</span>
    </span>`;
  
  document.getElementById('sidebar').innerHTML = sidebar;
  document.getElementById('prayerbar').innerHTML = prayerbar;
  
  if (iqamah===1) {
    document.getElementById('next').innerHTML = event[nextevent].en + ' Iqamah';
    if ( !document.getElementById("sidebar").classList.contains("iqamah") ) {
      document.getElementById("sidebar").classList.add("iqamah");
    };
  } else {
    if ( document.getElementById("sidebar").classList.contains("iqamah") ) {
      document.getElementById("sidebar").classList.remove("iqamah");
    };
  }
  if (salah===1) {
    if ( !document.getElementById("sidebar").classList.contains("salah") ) {
      document.getElementById("sidebar").classList.add("salah");
    };
  } else {
    if ( document.getElementById("sidebar").classList.contains("salah") ) {
      document.getElementById("sidebar").classList.remove("salah");
    };
  }
}

let images = ['assets/images/01.png', 'assets/images/02.png', 'assets/images/03.png', 'assets/images/04.png', 'assets/images/05.png', 'assets/images/06.png', 'assets/images/07.png', 'assets/images/08.png', 'assets/images/09.png', 'assets/images/10.png'];

let index = 0;
const imgElement = document.querySelector('#mainPhoto');

function change() {
   index > (images.length - 2) ? index = 0 : index++;
   imgElement.src = images[index];
}

timeCalc(); // run immediately on page load, and then every 1 second

window.onload = function () {
  setInterval(timeCalc, 1000); // timer every second
  setInterval(change, 20000); // image swap every 20 seconds
};
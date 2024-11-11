//+uses code from "Photorealistic 3D Maps in Maps JavaScript Places API Integration Demo" as a starting point


// ============================
//        Setup
// ============================

//+replace key here
let gmapKey = "";

(g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
  key: gmapKey, v: "alpha",
});

let map3DElement = null;
async function init() {
  const { Map3DElement } = await google.maps.importLibrary("maps3d");
  map3DElement = new Map3DElement({
    center: { lat: 47.655844, lng: -122.315059, altitude: 500 },
    // defaultUIDisabled: true,
    defaultLabelsDisabled: false,
    range: 1000,
    tilt: 30,
  });
  document.body.append(map3DElement);
  initAutocomplete();

  let newLocation = { latitude: '', longitude: '' };
  // ============================
  //        Polygons
  // ============================
  const { Polygon3DElement, AltitudeMode } = await google.maps.importLibrary("maps3d");

  const polygonOptions = {
      strokeColor: "#EA4335",
      strokeWidth: 4,
      fillColor: "rgba(255, 0, 0, 0.4)",
      altitudeMode: "RELATIVE_TO_GROUND",
      extruded: true,
      drawsOccludedSegments: false,
  }
  
  let currPolygon;

  // ============================
  //        Markers
  // ============================
  const { Marker3DInteractiveElement } = await google.maps.importLibrary('maps3d');
  const { PinElement } = await google.maps.importLibrary('marker');
  let marker;
  const flagImgUrl = 'https://www.gstatic.com/images/branding/productlogos/maps/v7/192px.svg';
  let glyphSvgPinElement;
  let locIndex;
  let locIndex2;
  let locations = [];
  let locationStats = new Map();
  let currArray = [];
  let infoArray = [];
  let hovCount = 0;
  let redCount = 0;
  let speedCount = 0;
  let sigCount = 0;
  let arrCount = 0;

  // ============================
  //        PapaParse
  // ============================
  fetch('cleanedData.csv')
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const rows = results.data;

        for (let i=0; i<rows.length; i++) {
          const row=rows[i];
          //console.log(`Row ${i + 1}:`, row);

          newLocation = { latitude: row.latitude, longitude: row.longitude };

          locIndex = locations.findIndex(loc => 
            Number(loc.latitude)-0.0001 < Number(row.latitude) && Number(loc.latitude)+0.0001 > Number(row.latitude) && Number(loc.longitude)-0.0001 < Number(row.longitude) && Number(loc.longitude)+0.0001 > Number(row.longitude)
          );
          
          //+checks for locations right next to each other
          //+there are cases where multiple cameras are basically right on top of each other
          if (locIndex === -1) {
            locations.push(newLocation); 
            locationStats.set(locations.length, [row.Violation_Date, row.Statute_Name, row.counts]);
            console.log('sigma sigma on the wall whos the skibidiest of them all');
            // ============================
            //        Polygons
            // ============================
            currPolygon = new google.maps.maps3d.Polygon3DElement(polygonOptions);

            currPolygon.outerCoordinates = [
              { lat: Number(row.latitude)-0.0001, lng: Number(row.longitude)-0.0001, altitude: 8 },
              { lat: Number(row.latitude)+0.0001, lng: Number(row.longitude)-0.0001, altitude: 8 },
              { lat: Number(row.latitude)+0.0001, lng: Number(row.longitude)+0.0001, altitude: 8 },
              { lat: Number(row.latitude)-0.0001, lng: Number(row.longitude)+0.0001, altitude: 8 }
            ];

            map3DElement.append(currPolygon);

            document.body.append(map3DElement);

            // ============================
            //        Markers
            // ============================
            marker = new Marker3DInteractiveElement({
              position: { lat: Number(row.latitude), lng: Number(row.longitude), altitude: 40 },
              altitudeMode: 'RELATIVE_TO_GROUND',
              extruded: true,
            });

            glyphSvgPinElement = new PinElement({
                background: 'white',
                glyph: new URL(flagImgUrl),
            });
            marker.append(glyphSvgPinElement);

            marker.addEventListener('gmp-click', (event) => {
              // console.log(event.target.position.Fg);
              // console.log(event.target.position.Hg);
              locIndex2 = locations.findIndex(loc2 => 
                Number(loc2.latitude)-0.0001 < Number(event.target.position.Fg) && Number(loc2.latitude)+0.0001 > Number(event.target.position.Fg) && Number(loc2.longitude)-0.0001 < Number(event.target.position.Hg) && Number(loc2.longitude)+0.0001 > Number(event.target.position.Hg)
              );
              if (locIndex2 === -1) {
                console.log('give up bro if this is breaking theres no point anymore');
              } else{
                infoArray = Array(locationStats.get(locIndex2+1))[0];
                // console.log(locIndex2);
                hovCount=0;
                redCount=0;
                speedCount=0;
                sigCount=0;
                arrCount=0;
                selectTab(0);
                for(let j=0; j<infoArray.length; j+=3){
                  // console.log(infoArray[j]); dates
                  // console.log(infoArray[j+1]); statute
                  // console.log(infoArray[j+2]); counts
                  if(infoArray[j+1]==="TCD OBSTRUCTING TRAFFIC AT SIGNAL CAMERA VIOLATION"){
                    sigCount += Number(infoArray[j+2]);
                  }else if(infoArray[j+1]==='SPEED, SCHOOL CROSSWALKS CAMERA VIOLATION'){
                    speedCount += Number(infoArray[j+2]);
                  }else if(infoArray[j+1]==="RED LIGHT CAMERA VIOLATION"){
                    redCount += Number(infoArray[j+2]);
                  }else if(infoArray[j+1]==="HOV LANE VIOLATION CAMERA VIOLATION"){
                    hovCount += Number(infoArray[j+2]);
                  }else if(infoArray[j+1]==="RED ARROW CAMERA VIOLATIONS"){
                    arrCount += Number(infoArray[j+2]);
                  }
                  addRow(0, [infoArray[j], infoArray[j+1],infoArray[j+2]]);
                }
                updateCell("hov", hovCount);
                updateCell("red", redCount);
                updateCell("speed", speedCount);
                updateCell("sig", sigCount);
                updateCell("arr", arrCount);
              }
            });

            map3DElement.append(marker);

            document.body.append(map3DElement);
          } else{
            currArray = Array(locationStats.get(locIndex+1))[0];
            currArray.push(row.Violation_Date, row.Statute_Name, row.counts);
            locationStats.set(locIndex+1, currArray);
          }
        }
      },
      error: function (error) {
        console.error("Error parsing CSV:", error.message);
      },
    });
    console.log(locations.length);
    console.log(locationStats);
  })
  .catch(error => console.error("Error fetching CSV file:", error));
}

// ============================
//        Search Function
// ============================
async function initAutocomplete() {
  const { Autocomplete } = await google.maps.importLibrary("places");
  const autocomplete = new Autocomplete(
      document.getElementById("pac-input"),
      {
        fields: [
          "geometry",
          "name",
          "place_id"
        ],
      }
  );
  autocomplete.addListener("place_changed", () => {
    //viewer.entities.removeAll();
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.viewport) {
      window.alert("No viewport for input: " + place.name);
      return;
    }
    zoomToViewport(place.geometry);
  });
}

//+zooms after search
const zoomToViewport = async (geometry) => {
  const { AltitudeMode, Polyline3DElement } = await google.maps.importLibrary("maps3d");
  let viewport = geometry.viewport;
  let locationPoints = [
    { lat: viewport.getNorthEast().lat(), lng: viewport.getNorthEast().lng() },
    { lat: viewport.getSouthWest().lat(), lng: viewport.getNorthEast().lng() },
    { lat: viewport.getSouthWest().lat(), lng: viewport.getSouthWest().lng() },
    { lat: viewport.getNorthEast().lat(), lng: viewport.getSouthWest().lng() },
    { lat: viewport.getNorthEast().lat(), lng: viewport.getNorthEast().lng() }
  ];
  if (map3DElement) {
    map3DElement.center = { lat: geometry.location.lat(), lng: geometry.location.lng(), altitude: 100 };
    map3DElement.range = 1000;
    map3DElement.tilt = 30;
  }
};

init();

// ============================
//        Tables
// ============================

let tablesYA = `<table><tr><th>Violation</th><th>Counts</th></tr><tr><td>HOV LANE VIOLATION</td><td id="hov">0</td></tr><tr><td>RED LIGHT VIOLATION</td><td id="red">0</td></tr><tr><td>SPEEDING/SCHOOL CROSSWALK</td><td id="speed">0</td></tr><tr><td>DISOBEYING OTHER SIGNAL</td><td id="sig">0</td></tr><tr><td>RED ARROW CAMERA VIOLATIONS</td><td id="arr">0</td></tr></table><table><tr><th>Date</th><th>Statute</th><th>Counts</th></tr></table>`;

function selectTab(index) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('selected'));

  tabs[index].classList.add('selected');

  const content = document.getElementById('content');
  content.innerHTML = tablesYA;
}

function addRow(tabIndex, rowData) {
  const content = document.getElementById('content');
  const tables = content.querySelectorAll('table');
  
  if (tables.length === 0) {
    console.warn(`No tables found for tab index ${tabIndex}`);
    return;
  }

  const lastTable = tables[tables.length - 1];

  const newRow = document.createElement('tr');

  rowData.forEach((cellData, colIndex) => {
    const newCell = document.createElement('td');
    newCell.textContent = cellData;
    newCell.id = `tab${tabIndex}-row${lastTable.rows.length}-col${colIndex + 1}`;
    newRow.appendChild(newCell);
  });

  lastTable.appendChild(newRow);
}

function updateCell(cellId, newValue) {
  const tables = document.querySelectorAll('#content table');
  if (tables.length > 0) {
    const firstTable = tables[0];
    const cell = firstTable.querySelector(`#${cellId}`);
    if (cell) {
      cell.textContent = newValue;
    } else {
      console.warn(`cell with id '${cellId}' not found in the first table`);
    }
  } else {
    console.warn("no tables found in the content");
  }
}

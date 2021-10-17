

var view = {};
var direcciones = [];
var puntos = [];
var variableRouteParameters= {};
var mapa= {};

function asignarNuevosIndices(indice) {
  var nuevoIndice, actual;
  //direcciones.legth+1 porque antes de llamar a este metodo se elimina una direccion
  for(var i = indice+1; i <= direcciones.length; i++) {
    nuevoIndice = i-1;
    //cambio indice del div
    actual = document.getElementById("div" + i);
    actual.setAttribute("id", "div" + nuevoIndice);
    //cambio indice de elimminar
    actual = document.getElementById("eliminar" + i);
    actual.setAttribute("id","eliminar" + nuevoIndice);
    actual.setAttribute("onClick","eliminarPuntoHTML("+nuevoIndice+")");
  }
}

function eliminarPuntoHTML(indice){
  var elementoAborrar = document.getElementById("div" + indice); 
  elementoAborrar.parentNode.removeChild(elementoAborrar);
  //borro un elemento a partir de la posicion: indice.
  direcciones.splice(indice,1);
  // elimina todos los points view.graphics.removeAll();
  view.graphics.remove(puntos[indice]);
  puntos.splice(indice, 1);
  asignarNuevosIndices(indice);
}

function guardarEnLista(direccion) {
  var divLista= document.getElementById("listaPuntos");
  var nuevo = document.createElement("div");
  nuevo.setAttribute("id", "div" + (direcciones.length-1));
  nuevo.innerHTML =
            '<table class="tablaPuntos">' +
              '<tbody>' +
                '<tr>' +
                `<td >${direccion.address}</td>` +
                '</tr>' +
                '<tr>' +
                  '<td> LON : </td>' +
                  `<td> ${direccion.location.x.toString().slice(0,10)} </td>` +
                '</tr>' +
                '<tr>' +
                  '<td> LAT:  </td>' +
                  `<td> ${direccion.location.y.toString().slice(0,10)}</td>` +
                '</tr>'+
                '<tr>' +
                  '<td>' +
                    `<button id="eliminar${direcciones.length-1}" onclick="eliminarPuntoHTML(${direcciones.length-1})">Eliminar punto</button>`
                  '</td>' +
                '</tr>'+
              '</tbody>'+
            '</table>' ;
  divLista.appendChild(nuevo);
}

function guardarData(routeId) {
    for (var i = 0; i < direcciones.length; i++) {
      var atributos = {};
      var addData = {};
      addData.geometry = direcciones[i].location;
      atributos.description = direcciones[i].attributes;
      atributos.eventid = routeId;
      addData.attributes = atributos;
      var params = `adds=${JSON.stringify([addData])}&f=json`;
      var request = new XMLHttpRequest();
      
      var requestUrl = "http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0/applyEdits"
      request.open('POST', requestUrl, false); 
      request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      request.send(params);
  }

function guardarPolilinea(direction) {
    var atributos = {};
    atributos.notes = "Grupo2 " + direcciones[0].address + " - " + direcciones[direcciones.length-1].address;
    atributos.recordedon = Date.now();
    var geometry = {};
    geometry.paths = direction;
    var addData = {};
    addData.geometry = geometry;
    addData.attributes = atributos;
    var params = `adds=${JSON.stringify([addData])}&f=json`;
    var request = new XMLHttpRequest();
    var requestUrl = "http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/applyEdits"
    request.open('POST', requestUrl, false); 
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send(params);
  
    if (request.status === 200) {
      var persistResponse = JSON.parse(request.response);
      guardarData(persistResponse.addResults[0].objectId);
    }
    else {
        console.log('errrrrr');
    }
  }

  function getRoute() {
    require([
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet",
        "esri/layers/FeatureLayer"
      ], function(route, RouteParameters, FeatureSet, FeatureLayer) {
      
        const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
        const routeParams = new RouteParameters({
        stops: new FeatureSet({
            features: view.graphics.toArray(),
        }),
        findBestSequence: true
        })

    
    route.solve(routeUrl, routeParams)
    .then(function(data) { 
      data.routeResults.forEach(async function(result) {
        result.route.symbol = {
          type: "simple-line",
          color: [5, 150, 255],
          width: 3
        };
        const rute = result.route.geometry.paths;
        guardarPolilinea(rute);      
        //Traer Feature Service
        const ruta = new FeatureLayer({
          url: "http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0"
        });
        mapa.add(ruta);

        view.graphics.add(result.route);
      });
    });
})
  }

const guardarDireccion = (result) => {
direcciones.push(result);
}

require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
      "esri/rest/locator",
      "esri/Graphic",
    "esri/widgets/Search",
    "esri/rest/route",
    "esri/rest/support/RouteParameters",
    "esri/rest/support/FeatureSet",
    "esri/layers/FeatureLayer"
  ], function(esriConfig,Map, MapView,locator, Graphic, Search, route, RouteParameters, FeatureSet, FeatureLayer) {
  
  esriConfig.apiKey = "AAPK336c7527d344421d8baba04844256a20StHFQ9s869HHuogrOW7BvVbfuOqM6eEJ-fqNf0WziAoV-rVTwJr07La2qCVA1_I_";
  const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
  mapa = new Map({
      basemap: "arcgis-navigation"
    });
  view = new MapView({
      container: "viewDiv",
      map: mapa,
      center: [-122.3321,47.6062],
      zoom: 12
    });
    
  const search = new Search({  //Add Search widget
    view: view
  });

  view.ui.add(search, "top-right"); //Add to the map
  search.on("select-result", (event) => {
    var direc= {
      id: direcciones.length,
      direccion: event.result.feature.attributes.Match_addr +',' + event.result.feature.attributes.StAddr
    }
    agregarAMapa(direc,locator);
  });

    //Show results
  function addGraphic(result) {
    const markerSymbol = {
      type: "simple-marker",
      outline: {
        color: "red",
        width: 5.5
      },
      color: "black",
      size: "10px"
    };
    
    const graphic = new Graphic({
      geometry: result.location,
      symbol: markerSymbol,
      attributes: result.attributes,
      popupTemplate: {
        title: "Address #" + result.attributes.ResultID,
        content:
          result.attributes.LongLabel +
          "<br>" +
          result.attributes.Type +
          "<br><br>" +
          result.location.x.toFixed(5) +
          ", " +
          result.location.y.toFixed(5),
      },
    });
    view.graphics.add(graphic);
    puntos.push(graphic);
  }


  const agregarAMapa = (direc,locator) => {
    const params = {
    addresses: []};
    const locatorUrl = "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

    params.addresses.push({
        'objectid': direc.id,
        'address': direc.direccion,
    })
    locator.addressesToLocations(locatorUrl, params).then(
      (results) => {
        if (results.length) {
          var cortar=false;
          for(var i=0;i<results.length;i++){
            if(results[i].attributes.Country=="USA"&&!cortar){
              cortar=true;
              guardarDireccion(results[i]);
              addGraphic(results[i]);
              guardarEnLista(results[i]);
            }
          }
        }
      },
      function (error) {
        console.log(error);
      });
  }
}
);

async function cargarRuta(id){
  var requestUrl = `http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/query?where=OBJECTID=${id}&f=json`;
  var request = new XMLHttpRequest();
  request.open("GET", requestUrl, false);
  var rutaCargar;
  request.send(null);
  if (request.status === 200) {
    var response = await JSON.parse(request.response);
    console.log('dale facha', response);
    if (response) {
      rutaCargar= response.features[0].geometry.paths;
    }
    else{
      console.log('error');
    }
  }
  require([
    "esri/Graphic",
    ], function(Graphic){
      var polyline = {
        type: "polyline", 
        paths: rutaCargar
      };
      var lineSymbol = {
        type: "simple-line",
        color: [21, 89, 200],
        width: 4
      };
      var polylineGraphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol
      });
      view.graphics.add(polylineGraphic);
    });
}

async function listarRutas(featuresIds) {
  for (var i = 0; i < featuresIds.length; i++) {
      var requestUrl = `http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/query?where=OBJECTID=${featuresIds[i]}&f=json`;
        var request = new XMLHttpRequest();
        request.open("GET", requestUrl, false);
        request.send(null);
        if (request.status === 200) {
          var requestResponse = await JSON.parse(request.response);
          console.log('jejejeje', requestResponse);
          if (requestResponse) {
            var nombreRuta= requestResponse.features[0].attributes.notes;
          }
        }
      //aca nos quedamos. nos falta ver los ids.
      var divRutas = document.getElementById("rutasAnteriores");
      var divNuevo = document.createElement("div");
      divNuevo.innerHTML = ` <div class="ruta"> `+
                              `${nombreRuta}`+ ` ` +
                              `<button id="${featuresIds[i]}" onClick="cargarRuta(${featuresIds[i]})">Cargar</button> `+
                              `</div>
                            `;
      
       divRutas.appendChild(divNuevo);
  }
}

async function consultarRutas() {

  var requestUrl = 'http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/query?where=notes%20SIMILAR%20TO%20%27Grupo2%25%27&returnIdsOnly=true&f=json';
  var request = new XMLHttpRequest();
  request.open("GET", requestUrl, false);
  request.send(null);
  if (request.status === 200) {
    var requestResponse = await JSON.parse(request.response);
    console.log('reqrep', requestResponse);
    console.log(requestResponse.features);
    if (requestResponse) {
      listarRutas(requestResponse.objectIds.reverse());
    }
  }
}

function getRutasAnteriores() {
  document.getElementById("listaPuntos").style.display = "none";
  consultarRutas();
}

function listarPuntos() {
  document.getElementById("listaPuntos").style.display = "block";
}
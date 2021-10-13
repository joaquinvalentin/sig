

var view = {};
var direcciones = [];
var puntos = [];
var variableRouteParameters= {};
var mapa= {};


function eliminarPuntoHTML(indice){
  var elementoAborrar = document.getElementById("div" + indice); 
  elementoAborrar.parentNode.removeChild(elementoAborrar);
  //borro un elemento a partir de la posicion: indice.
  direcciones.splice(indice,1);
  console.log(indice);
  // elimina todos los points view.graphics.removeAll();
  view.graphics.remove(puntos[indice]);
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
                    '<button onclick="eliminarPuntoHTML(direcciones.length-1)">Eliminar punto</button>'
                  '</td>' +
                '</tr>'+
              '</tbody>'+
            '</table>' ;
  divLista.appendChild(nuevo);
}

function guardarData(routeId) {
    for (var i = 0; i < direcciones.length; i++) {
        console.log('dentre',direcciones);
        console.log('rutaid',routeId)
      var atributos = {};
      var addData = {};
      addData.geometry = direcciones[i].location;
      atributos.description = direcciones[i].attributes;
      atributos.eventid = routeId;
      addData.attributes = atributos;
      console.log(addData)
      var params = `adds=${JSON.stringify([addData])}&f=json`;
      var request = new XMLHttpRequest();
      
      var requestUrl = "http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0/applyEdits"
      request.open('POST', requestUrl, false); 
      request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      request.send(params);
      console.log('desali')
      fetch(requestUrl, {
        method : "POST",
        params: `adds=${JSON.stringify([addData])}&f=json`,
        // -- or --
        // body : JSON.stringify({
            // user : document.getElementById('user').value,
            // ...
        // })
    }).then(
        response => response.text() // .json(), etc.
        // same as function(response) {return response.text();}
    ).then(
        html => console.log(html)
    );
    }
  }

function guardarPolilinea(direction) {
    var atributos = {};
    atributos.notes = "Grupo2";
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
    
      console.log('respuesta',data)
      data.routeResults.forEach(async function(result) {
        result.route.symbol = {
          type: "simple-line",
          color: [5, 150, 255],
          width: 3
        };
        console.log('rooooo',result.route.geometry.paths)
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
    console.log('event', event.resul)
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
    console.log('location',result.location)
    
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
          console.log(direcciones);
        }
      },
      function (error) {
        console.log(error);
      });
  }
}
);
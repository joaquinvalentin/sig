var view = {};
var direcciones = [];
var puntos = [];
var variableRouteParameters = {};
var mapa = {};
var capaEventos = {};
var capaRuta = {};
var rutaSimulacion = [];
var capaSimulacion = {};

function asignarNuevosIndices(indice) {
  var nuevoIndice, actual;
  //direcciones.legth+1 porque antes de llamar a este metodo se elimina una direccion
  for (var i = indice + 1; i <= direcciones.length; i++) {
    nuevoIndice = i - 1;
    //cambio indice del div
    actual = document.getElementById("div" + i);
    actual.setAttribute("id", "div" + nuevoIndice);
    //cambio indice de elimminar
    actual = document.getElementById("eliminar" + i);
    actual.setAttribute("id", "eliminar" + nuevoIndice);
    actual.setAttribute("onClick", "eliminarPuntoHTML(" + nuevoIndice + ")");
  }
}

function eliminarPuntoHTML(indice) {
  var elementoAborrar = document.getElementById("div" + indice);
  elementoAborrar.parentNode.removeChild(elementoAborrar);
  //borro un elemento a partir de la posicion: indice.
  direcciones.splice(indice, 1);
  // elimina todos los points view.graphics.removeAll();
  capaEventos.remove(puntos[indice]);
  puntos.splice(indice, 1);
  asignarNuevosIndices(indice);
}

function guardarEnLista(direccion) {
  var divLista = document.getElementById("listaPuntos");
  var nuevo = document.createElement("div");
  nuevo.setAttribute("id", "div" + (direcciones.length - 1));
  nuevo.innerHTML =
    '<table class="w3-card tablaPuntos">' +
    "<tbody>" +
    "<tr>" +
    `<td >${direccion.address}</td>` +
    "</tr>" +
    "<tr>" +
    "<td> LON : </td>" +
    `<td> ${direccion.location.x.toString().slice(0, 10)} </td>` +
    "</tr>" +
    "<tr>" +
    "<td> LAT:  </td>" +
    `<td> ${direccion.location.y.toString().slice(0, 10)}</td>` +
    "</tr>" +
    "<tr>" +
    "<td>" +
    `<button id="eliminar${
      direcciones.length - 1
    }" onclick="eliminarPuntoHTML(${
      direcciones.length - 1
    })">Eliminar punto</button>`;
  "</td>" + "</tr>" + "</tbody>" + "</table>";
  divLista.appendChild(nuevo);
}

function guardarData(routeId) {
  for (var i = 0; i < direcciones.length; i++) {
    var atributos = {};
    var addData = {};
    addData.geometry = direcciones[i].location;
    atributos.description = "Grupo2";
    atributos.event_type = 0;
    atributos.eventid = routeId;
    addData.attributes = atributos;
    var params = `adds=${JSON.stringify([addData])}&f=json`;
    var request = new XMLHttpRequest();

    var requestUrl =
      "http://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0/applyEdits";
    request.open("POST", requestUrl, false);
    request.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );
    request.send(params);
  }
}

function guardarPolilinea(direction) {
  var atributos = {};
  atributos.notes =
    "Grupo2 " +
    direcciones[0].address +
    " - " +
    direcciones[direcciones.length - 1].address;
  atributos.recordedon = Date.now();
  var geometry = {};
  geometry.paths = direction;
  var addData = {};
  addData.geometry = geometry;
  addData.attributes = atributos;
  var params = `adds=${JSON.stringify([addData])}&f=json`;
  var request = new XMLHttpRequest();
  var requestUrl =
    "http://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/applyEdits";
  request.open("POST", requestUrl, false);
  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  request.send(params);

  if (request.status === 200) {
    var persistResponse = JSON.parse(request.response);
    guardarData(persistResponse.addResults[0].objectId);
  }
}

function getRoute() {
  require([
    "esri/rest/route",
    "esri/rest/support/RouteParameters",
    "esri/rest/support/FeatureSet",
    "esri/layers/FeatureLayer",
  ], function (route, RouteParameters, FeatureSet, FeatureLayer) {
    const routeUrl =
      "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: capaEventos.graphics.toArray(),
      }),
      findBestSequence: true,
    });
    route.solve(routeUrl, routeParams).then(function (data) {
      data.routeResults.forEach(async function (result) {
        result.route.symbol = {
          type: "simple-line",
          color: [5, 150, 255],
          width: 3,
        };
        const rute = result.route.geometry.paths;
        rutaSimulacion = rute;
        guardarPolilinea(rute);
        //Traer Feature Service

        capaRuta.add(result.route);
      });
    });
  });
}

const guardarDireccion = (result) => {
  direcciones.push(result);
};

require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/rest/locator",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/widgets/Search",
  "esri/rest/route",
  "esri/rest/support/RouteParameters",
  "esri/rest/support/FeatureSet",
  "esri/layers/FeatureLayer",
], function (
  esriConfig,
  Map,
  MapView,
  locator,
  GraphicsLayer,
  Graphic,
  Search,
  route,
  RouteParameters,
  FeatureSet,
  FeatureLayer
) {
  esriConfig.apiKey =
    "AAPK4c0161f8038c4300a89c8dc088b8103bq0TEZjgFLTxQ1qSE0JuXvvzFi3wKu5BC-bI8YIGdRUHtiN3lXoliwvHGC0sDvuUA";
  const routeUrl =
    "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
  mapa = new Map({
    basemap: "streets-vector",
  });
  view = new MapView({
    container: "viewDiv",
    map: mapa,
    center: [-122.3321, 47.6062],
    zoom: 12,
  });

  const search = new Search({
    //Add Search widget
    view: view,
  });

  view.ui.add(search, "top-right"); //Add to the map
  search.on("select-result", (event) => {
    var direc = {
      id: direcciones.length,
      direccion:
        event.result.feature.attributes.Match_addr +
        "," +
        event.result.feature.attributes.StAddr,
    };
    agregarAMapa(direc, locator);
  });
  capaEventos = new GraphicsLayer();
  capaRuta = new GraphicsLayer();
  capaSimulacion = new GraphicsLayer();
  mapa.addMany([capaEventos, capaRuta, capaSimulacion]);

  //Show results
  function addGraphic(result) {
    const markerSymbol = {
      type: "simple-marker",
      outline: {
        color: "red",
        width: 5.5,
      },
      color: "black",
      size: "10px",
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
    capaEventos.add(graphic);
    puntos.push(graphic);
  }

  const agregarAMapa = (direc, locator) => {
    const params = {
      addresses: [],
    };
    const locatorUrl =
      "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

    params.addresses.push({
      objectid: direc.id,
      address: direc.direccion,
    });
    locator.addressesToLocations(locatorUrl, params).then(
      (results) => {
        if (results.length) {
          var cortar = false;
          for (var i = 0; i < results.length; i++) {
            if (results[i].attributes.Country == "USA" && !cortar) {
              cortar = true;
              guardarDireccion(results[i]);
              addGraphic(results[i]);
              guardarEnLista(results[i]);
            }
          }
        }
      },
      function (error) {
        console.log(error);
      }
    );
  };
});

function cargarPuntos(idRuta) {
  var requestUrl = `http://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0/query?where=eventId=${idRuta}&f=json`;
  var request = new XMLHttpRequest();
  request.open("POST", requestUrl, false);
  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  request.send(null);
  var respuesta = JSON.parse(request.response);
  for (var i = 0; i < respuesta.features.length; i++) {
    var coord = {};
    var direccion = {};
    coord.x = respuesta.features[i].geometry.x;
    coord.y = respuesta.features[i].geometry.y;
    direccion.location = coord;
    direccion.attribute = respuesta.features[i].attributes.description;
    direccion.address = "";
    direcciones.push(direccion);
    guardarEnLista(direccion);
    require(["esri/Graphic"], function (Graphic) {
      const markerSymbol = {
        type: "simple-marker",
        outline: {
          color: "red",
          width: 5.5,
        },
        color: "black",
        size: "10px",
      };

      var punto = {
        type: "point",
        x: direccion.location.x,
        y: direccion.location.y,
      };

      const graphic = new Graphic({
        geometry: punto,
        symbol: markerSymbol,
      });
      capaEventos.add(graphic);
      puntos.push(graphic);
    });
  }
}

async function cargarRuta(id) {
  var requestUrl = `http://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/query?where=OBJECTID=${id}&f=json`;
  var request = new XMLHttpRequest();
  request.open("GET", requestUrl, false);
  var rutaCargar;
  request.send(null);
  if (request.status === 200) {
    var response = await JSON.parse(request.response);
    if (response) {
      rutaCargar = response.features[0].geometry.paths;
      rutaSimulacion = rutaCargar;
      cargarPuntos(id);
    }
  }
  require(["esri/Graphic"], function (Graphic) {
    var polyline = {
      type: "polyline",
      paths: rutaCargar,
    };
    var lineSymbol = {
      type: "simple-line",
      color: [21, 89, 200],
      width: 4,
    };
    var polylineGraphic = new Graphic({
      geometry: polyline,
      symbol: lineSymbol,
    });
    capaRuta.add(polylineGraphic);
  });
}

async function listarRutas(featuresIds) {
  for (var i = 0; i < 1 /*featuresIds.length*/; i++) {
    var requestUrl = `http://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/query?where=OBJECTID=${featuresIds[i]}&f=json`;
    var request = new XMLHttpRequest();
    request.open("GET", requestUrl, false);
    request.send(null);
    if (request.status === 200) {
      var requestResponse = await JSON.parse(request.response);
      if (requestResponse) {
        var nombreRuta = requestResponse.features[0].attributes.notes;
      }
    }
    //aca nos quedamos. nos falta ver los ids.
    var divRutas = document.getElementById("rutasAnteriores");
    var divNuevo = document.createElement("div");
    divNuevo.innerHTML =
      ` <div class="ruta w3-card"> ` +
      `${nombreRuta}` +
      ` ` +
      `<button id="${featuresIds[i]}" onClick="cargarRuta(${featuresIds[i]})">Cargar</button> ` +
      `</div>
                            `;

    divRutas.appendChild(divNuevo);
  }
}

async function consultarRutas() {
  var requestUrl =
    "http://sampleserver6.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/query?where=notes%20SIMILAR%20TO%20%27Grupo2%25%27&returnIdsOnly=true&f=json";
  var request = new XMLHttpRequest();
  request.open("GET", requestUrl, false);
  request.send(null);
  if (request.status === 200) {
    var requestResponse = await JSON.parse(request.response);
    if (requestResponse) {
      var listaOrd = requestResponse.objectIds.sort(function (a, b) {
        return b - a;
      });
      listarRutas(listaOrd);
    }
  }
}

function getRutasAnteriores() {
  document.getElementById("rutasAnteriores").innerHTML = "";
  direcciones = [];
  document.getElementById("rutasAnteriores").style.display = "none";
  document.getElementById("listaPuntos").style.display = "none";
  document.getElementById("botonLP").className =
    "botonito w3-bar-item w3-button";
  document.getElementById("botonRA").className += " w3-red";
  document.getElementById("rutasAnteriores").style.display = "block";
  consultarRutas();
}

function listarPuntos() {
  document.getElementById("rutasAnteriores").style.display = "none";
  document.getElementById("botonRA").className =
    "botonito w3-bar-item w3-button";
  document.getElementById("botonLP").className += " w3-red";
  document.getElementById("listaPuntos").style.display = "block";
}

function pdf() {
  require([
    "esri/rest/support/PrintTemplate",
    "esri/rest/support/PrintParameters",
    "esri/rest/print",
  ], function (PrintTemplate, PrintParameters, PrintAPI) {
    const url =
      "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";

    const template = new PrintTemplate({
      format: "pdf",
      exportOptions: {
        dpi: 300,
      },
      layout: "a3-portrait",
      layoutOptions: {
        titleText: "SIG 2021 - Grupo 2",
        authorText: "Nicolas Fripp - Joaquin Valentin",
      },
    });

    const params = new PrintParameters({
      view: view,
      template: template,
    });

    PrintAPI.execute(url, params).then((res) =>
      window.open(res.url, "_blank").focus()
    );
  });
}

var iterador = 3;
var i = 0;
async function simular() {
    
    console.log(rutaSimulacion);
    
    var contadorPuntos = 0;
    var distanciaTotal = 0;
    while (i + iterador < (rutaSimulacion[0].length)) {
        var distancia = calcCrow(rutaSimulacion[0][i][0], rutaSimulacion[0][i][1],
            rutaSimulacion[0][i + iterador][0], rutaSimulacion[0][i + iterador][1]);
        distanciaTotal = distanciaTotal + distancia;
        i = i + iterador;
        contadorPuntos = contadorPuntos + 1;
    }
    //distancia aproximada q se tieneque hacer por cada punto que se compute
    distanciaMedia = distanciaTotal / contadorPuntos;
    //paso a metros
    distanciaMedia *= 1000
    console.log(distanciaTotal);
    console.log(distanciaMedia);
    i = 0;
    while (i + iterador < (rutaSimulacion[0].length)) {
        capaSimulacion.removeAll();
        mapear();
        const sl = await dormir();
        i = i + iterador;
    }
}

function dormir() {
    return new Promise(resolve => setTimeout(resolve, 5000))
}
//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}

var distanciaMedia = 0;
function mapear() {
    require([
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/tasks/GeometryService",
        "esri/geometry/Polygon",
        "esri/geometry/Point",
    ], function  (GraphicsLayer, Graphic, GeometryService, Polygon, Point) {
        console.log("entre");
        function dibujarCapaSimulacion(indice) {
            var point = {
                type: "point",
                x: rutaSimulacion[0][indice][0],
                y: rutaSimulacion[0][indice][1]
            };

            markerSymbol = {
                type: "simple-marker",
                color: "black",
                size: "10px",
                outline: {
                    color: "blue",
                    width: 5.5
                },
            };
            var graphic = new Graphic({
                geometry: point,
                symbol: markerSymbol
            });
            capaSimulacion.add(graphic);
        }
        function pintarPoligono(poligono) {
            var poligon = {
              type: "polygon", 
              rings: poligono
            };
            var anillo = {
              type: "simple-fill", 
              outline: {
                color: "white",
                width: 1
              }
            };
            var polygonGraphic = new Graphic({
              symbol: anillo,
              geometry: poligon,
            });
            capaSimulacion.add(polygonGraphic);
          }

        dibujarCapaSimulacion(i);
        var bufferRequestUrl = `http://tasks.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/buffer?geometries=${rutaSimulacion[0][i][0]},${rutaSimulacion[0][i][1]}&inSR=4326&outSR=4326&bufferSR=&distances=0.05&unit=&unionResults=false&geodesic=false&f=json`;
        var requestBuffer = new XMLHttpRequest();
        requestBuffer.open("GET", bufferRequestUrl, false);
        requestBuffer.send(null);
        var respuestaBuffer = {};
        if (requestBuffer.status === 200) {
            respuestaBuffer = JSON.parse(requestBuffer.response);
        }
    
        pintarPoligono(respuestaBuffer.geometries[0].rings);

    });

}
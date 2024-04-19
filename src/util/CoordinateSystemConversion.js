export const mercatorTolonlat = mercator => {
    let lonlat = []
    let longitude = mercator[0] / 20037508.34 * 180;
    let latitude = mercator[1] / 20037508.34 * 180;
    latitude = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2);
    lonlat.push(longitude)
    lonlat.push(latitude)
    return lonlat;
}
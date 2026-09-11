const EARTH_RADIUS_KM = 6371.0088;

function radians(value) {
  return (Number(value) * Math.PI) / 180;
}

export function haversineKm(origin, destination) {
  const [originLongitude, originLatitude] = origin.map(Number);
  const [destinationLongitude, destinationLatitude] = destination.map(Number);
  if (![originLongitude, originLatitude, destinationLongitude, destinationLatitude].every(Number.isFinite)) {
    return Number.POSITIVE_INFINITY;
  }
  const latitudeDelta = radians(destinationLatitude - originLatitude);
  const longitudeDelta = radians(destinationLongitude - originLongitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(originLatitude)) * Math.cos(radians(destinationLatitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function segmentDistanceKm(point, start, end) {
  const referenceLatitude = radians((Number(start[1]) + Number(end[1]) + Number(point[1])) / 3);
  const scaleLongitude = Math.cos(referenceLatitude);
  const project = ([longitude, latitude]) => [
    radians(Number(longitude) - Number(point[0])) * scaleLongitude * EARTH_RADIUS_KM,
    radians(Number(latitude) - Number(point[1])) * EARTH_RADIUS_KM,
  ];
  const [startX, startY] = project(start);
  const [endX, endY] = project(end);
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const denominator = deltaX ** 2 + deltaY ** 2;
  const ratio = denominator === 0
    ? 0
    : Math.max(0, Math.min(1, -(startX * deltaX + startY * deltaY) / denominator));
  return Math.hypot(startX + ratio * deltaX, startY + ratio * deltaY);
}

function lineDistanceKm(point, coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return Number.POSITIVE_INFINITY;
  if (coordinates.length === 1) return haversineKm(point, coordinates[0]);
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 1; index < coordinates.length; index += 1) {
    minimum = Math.min(minimum, segmentDistanceKm(point, coordinates[index - 1], coordinates[index]));
  }
  return minimum;
}

export function distanceToGeometryKm(point, geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return Number.POSITIVE_INFINITY;
  switch (geometry.type) {
    case "Point":
      return haversineKm(point, geometry.coordinates);
    case "MultiPoint":
      return Math.min(...geometry.coordinates.map((coordinate) => haversineKm(point, coordinate)));
    case "LineString":
      return lineDistanceKm(point, geometry.coordinates);
    case "MultiLineString":
    case "Polygon":
      return Math.min(...geometry.coordinates.map((line) => lineDistanceKm(point, line)));
    case "MultiPolygon":
      return Math.min(
        ...geometry.coordinates.flatMap((polygon) => polygon.map((line) => lineDistanceKm(point, line))),
      );
    default:
      return Number.POSITIVE_INFINITY;
  }
}

export function nearestFeature(point, features = []) {
  return features.reduce((nearest, feature) => {
    const distanceKm = distanceToGeometryKm(point, feature?.geometry);
    return distanceKm < nearest.distanceKm ? { feature, distanceKm } : nearest;
  }, { feature: null, distanceKm: Number.POSITIVE_INFINITY });
}


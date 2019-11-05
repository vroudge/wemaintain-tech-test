SELECT * FROM `default` as concert
JOIN `default` as band ON concert.bandId = META(band).id
JOIN `default` as venue ON concert.venueId= META(venue).id
WHERE concert.bandId="band::1"

CREATE INDEX `defaultkindbandididx` ON `default`(`bandId`)
CREATE INDEX `defaultkindvenueididx` ON `default`(`venueId`)

SELECT
	sub.band.name as band,
	sub.venue.name as location,
	sub.concert.date,
	sub.venue.latitude,
	sub.venue.longitude
FROM (
	SELECT * FROM `default` as concert
		JOIN `default` as band ON concert.bandId = META(band).id
		JOIN `default` as venue ON concert.venueId= META(venue).id
	WHERE concert.bandId IN ["band::1", "band::10", "band:100", "band::1000", "band:101"]
) as sub

SELECT
    sub.band.name as band,
    sub.venue.name as location,
    sub.concert.date,
    sub.venue.latitude,
    sub.venue.longitude
  FROM (
    SELECT * FROM `default` as concert
      JOIN `default` as band ON concert.bandId = META(band).id
      JOIN `default` as venue ON concert.venueId= META(venue).id
    WHERE
(RADIANS(venue.latitude) >= 0.6592722390404687 AND RADIANS(venue.latitude) <= 0.6595858102290463)
AND (RADIANS(venue.longitude) >= -2.1712657932867594 AND RADIANS(venue.longitude) <= -2.170869039579853)
AND acos(sin( RADIANS(37.78249999999999)) * sin (RADIANS(venue.latitude)) + cos( RADIANS(37.78249999999999))
* cos(RADIANS(venue.latitude)) * cos (RADIANS(venue.longitude) - RADIANS(-124.393))) <= 1.5678559428873982
  ) as sub

/////////////////

SELECT
    sub.band.name as band,
    sub.venue.name as location,
    sub.concert.date,
    sub.venue.latitude,
    sub.venue.longitude
  FROM (
    SELECT * FROM `default` as concert
      JOIN `default` as band ON concert.bandId = META(band).id
      JOIN `default` as venue ON concert.venueId= META(venue).id
    WHERE
(RADIANS(venue.latitude) >= 0.6592722390404687 AND RADIANS(venue.latitude) <= 0.6595858102290463)
AND (RADIANS(venue.longitude) >= -2.1712657932867594 AND RADIANS(venue.longitude) <= -2.170869039579853)
AND acos(sin( RADIANS(37.78249999999999)) * sin (RADIANS(venue.latitude)) + cos( RADIANS(37.78249999999999))
* cos(RADIANS(venue.latitude)) * cos (RADIANS(venue.longitude) - RADIANS(-124.393))) <= 1.5678559428873982
  ) as sub
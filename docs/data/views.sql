BEGIN TRANSACTION;
CREATE VIEW gnd AS
SELECT
    adm4.pcode AS gnd_code,
    adm4.no AS gnd_no,
    adm4.en AS gnd_name,
    adm3.pcode AS dsd_code,
    adm3.en AS dsd_name,
    adm2.pcode AS dist_code,
    adm2.en AS dist_name,
    adm1.pcode AS prov_code,
    adm1.en AS prov_name
FROM adm4
JOIN adm3
    ON adm4.adm3_pcode = adm3.pcode
JOIN adm2
    ON adm3.adm2_pcode = adm2.pcode
JOIN adm1
    ON adm2.adm1_pcode = adm1.pcode;


CREATE VIEW dsd AS
SELECT
    adm3.pcode AS dsd_code,
    adm3.en AS dsd_name,
    adm2.pcode AS dist_code,
    adm2.en AS dist_name,
    adm1.pcode AS prov_code,
    adm1.en AS prov_name
FROM adm3
JOIN adm2
    ON adm3.adm2_pcode = adm2.pcode
JOIN adm1
    ON adm2.adm1_pcode = adm1.pcode;


CREATE VIEW dist AS
SELECT
    adm2.pcode AS dist_code,
    adm2.en AS dist_name,
    adm1.pcode AS prov_code,
    adm1.en AS prov_name
FROM adm2
JOIN adm1
    ON adm2.adm1_pcode = adm1.pcode;

-- SELECT STATEMENTS

SELECT 
    gnd.dsd_name,
    gnd.dsd_code,
    SUM(male) as male,
    SUM(female) as female
FROM gnd
JOIN geo_data as data
ON gnd.gnd_code = data.gnd_code
GROUP BY gnd.dsd_code;

SELECT 
    gnd.dist_name,
    gnd.dist_code,
    SUM(male) as male,
    SUM(female) as female
FROM gnd
JOIN geo_data as data
ON gnd.gnd_code = data.gnd_code
GROUP BY gnd.dist_code;

SELECT
    gnd.prov_name,
    gnd.prov_code,
    SUM(male) as male,
    SUM(female) as female
FROM gnd
JOIN geo_data as data
ON gnd.gnd_code = data.gnd_code
GROUP BY gnd.prov_code;
COMMIT;
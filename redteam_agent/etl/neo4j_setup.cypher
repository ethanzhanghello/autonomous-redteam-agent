CREATE CONSTRAINT v_cve_unique IF NOT EXISTS
FOR (v:Vulnerability) REQUIRE v.cve_id IS UNIQUE;

CREATE CONSTRAINT asset_id_unique IF NOT EXISTS
FOR (a:Asset) REQUIRE a.asset_id IS UNIQUE;

CREATE INDEX product_cpe_index IF NOT EXISTS
FOR (p:Product) ON (p.cpe);

CREATE INDEX version_semver_index IF NOT EXISTS
FOR (v:Version) ON (v.semver_normalized);


import alasql from 'alasql';
import { sql_districts, sql_dsd, sql_gnd } from './data.js';

alasql("CREATE TABLE province (code INT, name_en STRING, name_si STRING, name_ta STRING)");
alasql("INSERT INTO province VALUES (1, 'Western', 'බස්නාහිර', 'மேல்')");
alasql("INSERT INTO province VALUES (2, 'Central', 'මධ්‍යම', 'மத்திய')");
alasql("INSERT INTO province VALUES (3, 'Southern', 'දකුණු', 'தென்')");
alasql("INSERT INTO province VALUES (4, 'North Western', 'වයඹ', 'வட மேல்')");
alasql("INSERT INTO province VALUES (5, 'Sabaragamuwa', 'සබරගමුව', 'சபரகமுவ')");
alasql("INSERT INTO province VALUES (6, 'Eastern', 'නැගෙනහිර', 'கிழக்கு')");
alasql("INSERT INTO province VALUES (7, 'Uva', 'ඌව', 'ஊவா')");
alasql("INSERT INTO province VALUES (8, 'North Central', 'උතුරු මැද', 'வட மத்திய')");
alasql("INSERT INTO province VALUES (9, 'Northern', 'උතුරු', 'வட')");

alasql(sql_districts);
// alasql(sql_dsd);
// alasql(sql_gnd);


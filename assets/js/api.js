import alasql from 'alasql';
alasql("CREATE TABLE provinces (id INT NOT NULL, name_en STRING, name_si STRING, name_ta STRING)");
alasql("INSERT INTO provinces VALUES (1, 'Western', 'බස්නාහිර', 'மேல்')");
alasql("INSERT INTO provinces VALUES (2, 'Central', 'මධ්‍යම', 'மத்திய')");
alasql("INSERT INTO provinces VALUES (3, 'Southern', 'දකුණු', 'தென்')");
alasql("INSERT INTO provinces VALUES (4, 'North Western', 'වයඹ', 'வட மேல்')");
alasql("INSERT INTO provinces VALUES (5, 'Sabaragamuwa', 'සබරගමුව', 'சபரகமுவ')");
alasql("INSERT INTO provinces VALUES (6, 'Eastern', 'නැගෙනහිර', 'கிழக்கு')");
alasql("INSERT INTO provinces VALUES (7, 'Uva', 'ඌව', 'ஊவா')");
alasql("INSERT INTO provinces VALUES (8, 'North Central', 'උතුරු මැද', 'வட மத்திய')");
alasql("INSERT INTO provinces VALUES (9, 'Northern', 'උතුරු', 'வட')");


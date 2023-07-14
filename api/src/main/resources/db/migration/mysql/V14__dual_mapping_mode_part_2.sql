CREATE OR REPLACE VIEW map_view AS 
    SELECT UUID() as 'id', id AS map_row_id, status, blind_map_flag, null as sibling_row_author_task_id
    FROM map_row 
    WHERE map_row.blind_map_flag = false
UNION
    SELECT UUID() as 'id', mr1.id AS map_row_id, (CASE WHEN mr1.status != mr2.status THEN '1' ELSE mr1.status END), mr1.blind_map_flag,
    mr2.author_task_id
    FROM map_row mr1, map_row mr2
    WHERE mr1.source_code_id = mr2.source_code_id
    AND mr1.id < mr2.id
    and mr1.map_id = mr2.map_id
	AND mr1.blind_map_flag = true; 
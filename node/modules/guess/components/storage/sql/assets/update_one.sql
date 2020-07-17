UPDATE assets SET ${updateSet:raw} WHERE id = (SELECT id FROM assets ${parsedFilters:raw} LIMIT 1);

UPDATE user_record SET ${updateSet:raw} WHERE id = (SELECT id FROM user_record ${parsedFilters:raw} LIMIT 1);
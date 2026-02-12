/*
  Add scheduling metadata to quotes

  - job_number (text)
  - start_time (text)
*/

alter table quotes add column if not exists job_number text;
alter table quotes add column if not exists start_time text;

# Project Status

This project displays UN General Assembly speeches and includes a speech similarity visualization using a heatmap. The SQLite deployment proved challenging. Next steps when time permits:

- Migrate to PostgreSQL with pgvector for improved vector operations
- Resolve deployment and database hosting issues

The migration from SQLite to PostgreSQL will require significant data transformation work. So currently this is on hold. If I do pick this up again the steps to take are:

- Export data from SQLite (without the embedding + similarity columns, as they will be recalculated)
- Import the data into PostgreSQL
- Recalculate embeddings and similarities using pgvector
- Update the application to use PostgreSQL

## Future ideas:

More data analysis of what speeches are similar:

- for instance, show how similarity changes of time for two countries
- or how similarity changes for a country over time
- do analysis for specific topics or themes
- see what countries have the least similar speeches, why are they unique?
- show what countries have the most similar speeches, and what are the common themes?

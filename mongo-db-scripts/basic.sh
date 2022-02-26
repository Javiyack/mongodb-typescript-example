mongosh --port 27017

show dbs
use <db_name>
use mongo_cretification
show collections
db.createCollection('user')
db.user.drop()
db.dropDatabase()
db.user.insert({nombre: 'Javier', apellidos: 'Llach Fernández'})



const express = require('express')
const app = express()
app.use(express.urlencoded());

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true, useUnifiedTopology: true});

// forbid incomplete
const snakeSchema = new mongoose.Schema({
    binomial: {
        type: String,
        unique: true
    },
    popular: String,
    venomous: Boolean
});

const Snake = mongoose.model('Snake', snakeSchema);

Snake.validate();

const port = 3000;

app.get('/:id?', (req, res) => {
    const { id } = req.params;
    Snake.find(id ? { _id: id } : {}).exec(function(err, res2) { // django does provide an automatic id field, but you may access it without underscore
        res.json(res2);
    });
});

app.get('/:id/first', (req, res) => {
    const { id } = req.params;
    Snake.findOne({ _id: id }).exec(function(err, res2) { // django does provide an automatic id field, but you may access it without underscore
        res.json(res2);
    });
});



app.post('/', (req, res) => {
    const newSnake = new Snake(req.body);
    newSnake.save(err => {
        if (err) {
            res.send('error when saving' + err);
        } else {
            res.send(`New snake: ${newSnake.binomial} a.k.a. ${newSnake.popular}. Dangerous? ${newSnake.venomous ? 'Yes' : 'No'}.`);
        }
    });
});
// curl -X POST --data "binomial=Boa constrictor&popular=jiboia-constritora&venomous=false" http://localhost:3000
// curl -X POST --data "binomial=Bothrops jararaca&popular=jararaca-da-mata&venomous=true" http://localhost:3000
// curl -X POST --data "binomial=Crotalus durissus&popular=cascavel&venomous=true" http://localhost:3000
// curl -X POST --data "binomial=Eunectes murinus&popular=sucuri-verde&venomous=false" http://localhost:3000



app.delete('/', (req, res) => {
    Snake.deleteMany({}, function (error, mongooseDeleteResult){
        res.send('Snakes killed: ' + mongooseDeleteResult.deletedCount);
    });
});
// curl -X DELETE http://localhost:3000

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

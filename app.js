require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose')
const _ = require('lodash')


const app = express();


app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));


//==================================Data base connection========================================
mongoose.connect("mongodb+srv://"+process.env.DB_CONNECTION+".pnyea.mongodb.net/My-todolist",{
  useNewUrlParser: true,
  useUnifiedTopology: true
 })
const db = mongoose.connection;
db.on('error', console.error.bind(console, "Connection Error"));
db.once('open', ()=>console.log("We are now connected to our Cloud Database"))

//==============================================================================

const itemSchema = {
  name: String
};

const Item = mongoose.model('Item', itemSchema);


const defaultItem1 = new Item({
  name: "Welcome to your ToDoList"
})
const defaultItem2 = new Item({
  name: "<-- check this for finished task"
})
const defaultItem3 = new Item({
  name: "Click this to delete your task-->"
})

const defaultItems = [defaultItem1, defaultItem2, defaultItem3]

const listSchema = {
    name: String,
    items: [itemSchema]
  }

const List = mongoose.model('List', listSchema)

app.get("/", function (req, res) {
  Item.find({}, (err,foundItems)=>{
    if(foundItems.length === 0){
       Item.insertMany(defaultItems, (err)=>{
        if(err){
          console.log(err)
        }else{
          res.redirect("/")
        }
      })
    }else{
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
});

app.get("/:newListTitle", function(req,res){
  const newListTitle = _.capitalize(req.params.newListTitle);

  List.findOne({name: newListTitle }, (err,foundItems)=>{
    if(!err){
      if(!foundItems){
        const newList = new List({
          name: newListTitle,
          items: defaultItems
        })

        newList.save()
        res.redirect(`/${newListTitle}`)
      }else{
        res.render("list", { listTitle: foundItems.name, newListItems: foundItems.items })
      }
    }
  })
})

app.post("/", function (req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list 

  const item = new Item({
    name: newItem
  })

  if(listName === "Today"){
    item.save()
    res.redirect("/")   
  }else{
    List.findOne({name: listName}, (err,foundList)=>{
      foundList.items.push(item)
      foundList.save()
      res.redirect(`/${foundList.name}`)
    })
  }
  
});

app.post("/delete", (req,res)=>{
  const id = req.body.delete;
  const listName = req.body.list

  if(listName === "Today"){
    Item.findByIdAndRemove(id, (err)=>(err)? console.log(err): res.redirect("/"))
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: id}}}, (err,result)=>{
      if(!err){
        res.redirect(`/${listName}`)
      }
    })
  }
})


let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port,function(){
  console.log("App is listening to Port " + port)
});

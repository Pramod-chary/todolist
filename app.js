const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const dotenv = require("dotenv");
const todayDate = date.getDate();
const app = express();

app.set("view engine", "ejs");
dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoose = require("mongoose");
//used to avoid depreceating warning
mongoose.set("strictQuery", false);
//connecting mongoose to localhost

const DB = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.cu5fufr.mongodb.net/todoListDB?retryWrites=true&w=majority`;
console.log(DB);
//const DB = "mongodb://127.0.0.1:27017/todoListDb";

mongoose
  .connect(DB)
  .then(() => {
    console.log("connected");
  })
  .catch((err) => console.log(err));

const itemsSchema = new mongoose.Schema({
  name: "String",
});

const listSchema = new mongoose.Schema({
  name: "String",
  items: [itemsSchema],
});

const ItemCollection = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

// const item1 = new ItemCollection({
//   name: "Breakfast",
// });

// const item2 = new ItemCollection({
//   name: "Lunch",
// });

// const item3 = new ItemCollection({
//   name: "Dinner",
// });

const listItems = [];

// ItemCollection.insertMany(totalItems, function (err) {
//   if (err) console.log(err);
//   else console.log("inserted successfully");
// });

app.get("/", function (req, res) {
  const day = date.getDate();
  ItemCollection.find(function (err, itemsArray) {
    if (err) console.log(err);
    else {
      res.render("list", { listTitle: day, newListItems: itemsArray });
    }
  });
});

app.get("/:customListName", function (req, res) {
  if (req.params.customListName != "favicon.ico") {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, function (err, foundList) {
      if (!err) {
        if (!foundList) {
          const newList = new List({
            name: customListName,
            items: listItems,
          });
          newList.save();
          res.redirect("/" + customListName);
        } else {
          res.render("list", {
            listTitle: customListName,
            newListItems: foundList.items,
          });
        }
      }
    });
  }
});

app.post("/", function (req, res) {
  const item = req.body.newItem;
  const curRouteName = req.body.list;
  const curItem = new ItemCollection({
    name: item,
  });
  if (curRouteName === todayDate + "") {
    if (curItem.name.length > 0) {
      curItem.save();
    }
    res.redirect("/");
  } else {
    List.findOne({ name: curRouteName }, function (err, foundList) {
      foundList.items.push(curItem);
      foundList.save();
      res.redirect("/" + curRouteName);
    });
  }
});

app.post("/delete", function (req, res) {
  const curDeleteItem = req.body.deleteButton;
  const curDeleteListName = req.body.listName;
  if (curDeleteListName === todayDate + "") {
    ItemCollection.findByIdAndRemove(curDeleteItem, function (err) {
      if (err) console.log(err);
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: curDeleteListName },
      { $pull: { items: { _id: curDeleteItem } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + curDeleteListName);
        }
      }
    );
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});

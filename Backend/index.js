const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 5000;

const userRouter = require("./routes/user");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/user", userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


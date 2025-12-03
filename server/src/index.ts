import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
// import postsRouter from "./routes/posts";
// import usersRouter from "./routes/users";
import stabilityRouter from "./routes/stability";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// app.use("/posts", postsRouter);
// app.use("/users", usersRouter); 
app.use("/stability", stabilityRouter);

export { app };

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

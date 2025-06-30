import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.create({data:{
    name:"hello",
    email:"hello@gmail.com"
  }});
  console.log(users);
}

main().catch((e) => console.log(e));

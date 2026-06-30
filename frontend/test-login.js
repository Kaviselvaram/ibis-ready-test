import { AuthenticationRepository } from "./src/repositories/AuthenticationRepository.js";
AuthenticationRepository.signIn("testadmin@ibis.com", "password123").then(res => console.log(res)).catch(console.error);

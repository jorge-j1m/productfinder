// "use client";

// import { Store } from "lucide-react";
// import { useState } from "react";
// import { z } from "zod";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import AuthService from "@/lib/auth";

// // Client-side validation schemas - individual field validation
// const emailSchema = z.email();
// const passwordSchema = z.string().min(1, "Password is required");

// export function LoginForm() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [remember, setRemember] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [errors, setErrors] = useState<{ email?: string; password?: string }>(
//     {},
//   );

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrors({});

//     // Client-side validation - validate each field individually
//     const fieldErrors: { email?: string; password?: string } = {};

//     const emailValidation = emailSchema.safeParse(email);
//     if (!emailValidation.success) {
//       fieldErrors.email =
//         emailValidation.error.message || "Please enter a valid email address";
//     }

//     const passwordValidation = passwordSchema.safeParse(password);
//     if (!passwordValidation.success) {
//       fieldErrors.password =
//         passwordValidation.error.message || "Password is required";
//     }

//     if (Object.keys(fieldErrors).length > 0) {
//       setErrors(fieldErrors);
//       return;
//     }

//     setIsLoading(true);

//     try {
//       await AuthService.signIn("credentials", {
//         email,
//         password,
//         remember: remember.toString(),
//         redirectTo: "/dashboard",
//       });

//       // NextAuth handles the redirect automatically
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-background p-6">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
//             <Store className="w-6 h-6 text-primary-foreground" />
//           </div>
//           <CardTitle className="text-2xl">ProductFinder Admin</CardTitle>
//           <CardDescription>Sign in to your admin panel</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email address</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={(e) => {
//                   setEmail(e.target.value);
//                   if (errors.email)
//                     setErrors((prev) => ({ ...prev, email: undefined }));
//                 }}
//                 required
//                 disabled={isLoading}
//                 className={errors.email ? "border-destructive" : ""}
//               />
//               {errors.email && (
//                 <p className="text-sm text-destructive">{errors.email}</p>
//               )}
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={(e) => {
//                   setPassword(e.target.value);
//                   if (errors.password)
//                     setErrors((prev) => ({ ...prev, password: undefined }));
//                 }}
//                 required
//                 disabled={isLoading}
//                 className={errors.password ? "border-destructive" : ""}
//               />
//               {errors.password && (
//                 <p className="text-sm text-destructive">{errors.password}</p>
//               )}
//             </div>
//             <div className="flex items-center space-x-2">
//               <Checkbox
//                 id="remember"
//                 checked={remember}
//                 onCheckedChange={(checked) => setRemember(checked === true)}
//                 disabled={isLoading}
//               />
//               <Label htmlFor="remember" className="text-sm font-normal">
//                 Keep me signed in
//               </Label>
//             </div>
//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading ? "Signing in..." : "Sign In"}
//             </Button>
//             <div className="text-center">
//               <Button variant="link" className="text-sm" disabled>
//                 Forgot password?
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

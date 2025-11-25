"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Schemas separados
const loginSchema = z.object({
  email: z.string().email({ message: "Correo invalido" }),
  password: z.string().min(6, { message: "Minimo 6 caracteres" }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Minimo 2 caracteres" }),
  email: z.string().email({ message: "Correo invalido" }),
  password: z.string().min(6, { message: "Minimo 6 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Tipos inferidos
type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Usar el form con el tipo correcto segun el modo
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const form = mode === "login" ? loginForm : signupForm;

  async function onSubmit(values: LoginFormValues | SignupFormValues) {
    setIsLoading(true);
    try {
      if (mode === "signup") {
        const signupValues = values as SignupFormValues;
        
        // Crear usuario
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          signupValues.email,
          signupValues.password
        );
        
        // Actualizar perfil
        await updateProfile(userCredential.user, {
          displayName: signupValues.name,
        });

        // Guardar en Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: signupValues.name,
          email: signupValues.email,
          createdAt: new Date().toISOString(),
        });

        toast.success("Cuenta creada exitosamente");
      } else {
        const loginValues = values as LoginFormValues;
        
        // Iniciar sesion
        await signInWithEmailAndPassword(
          auth,
          loginValues.email,
          loginValues.password
        );
        toast.success("¡Bienvenido!");
      }
      
      router.push("/dashboard-ventas");
    } catch (error: any) {
      console.error("Error:", error);
      
      const errorMessages: Record<string, string> = {
        "auth/email-already-in-use": "El correo ya esta registrado",
        "auth/invalid-credential": "Credenciales invalidas",
        "auth/user-not-found": "Usuario no encontrado",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/too-many-requests": "Demasiados intentos, intenta mas tarde",
      };

      toast.error(errorMessages[error.code] || "Error en la autenticacion");
    } finally {
      setIsLoading(false);
    }
  }

  // Renderizar formulario de login
  if (mode === "login") {
    return (
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={loginForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electronico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={loginForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sesion
          </Button>
        </form>
      </Form>
    );
  }

  // Renderizar formulario de signup
  return (
    <Form {...signupForm}>
      <form onSubmit={signupForm.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={signupForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={signupForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electronico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={signupForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={signupForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" 
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Cuenta
        </Button>
      </form>
    </Form>
  );
}
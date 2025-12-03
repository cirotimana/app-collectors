import { AuthForm }  from "@/components/auth/AuthForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Bienvenido</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
          {/* <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/signup" className="font-medium text-red-600 hover:underline">
              Registrate
            </Link>
          </p> */}
        </CardContent>
      </Card>
    </div>
  );
}
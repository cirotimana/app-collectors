import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "../button"
import { Input } from "../input"
import userEvent from "@testing-library/user-event"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../form"

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }),
})

// Dentro de tu archivo de test, modifica el TestForm así:
function TestForm({ onSubmit }: { onSubmit: (values: z.infer<typeof formSchema>) => void }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
        },
    })

    return (
        <Form {...form}>
            {/* Cambiamos la forma en que se maneja el submit para el test */}
            <form 
                onSubmit={(e) => {
                    e.preventDefault(); // Detiene el envío nativo
                    form.handleSubmit(onSubmit)(e);
                }} 
                className="space-y-8"
            >
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="shadcn" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}

describe("Form", () => {
    it("renders correctly and validates", async () => {
        const user = userEvent.setup() // 2. Configurar el usuario
        const onSubmit = jest.fn()
        render(<TestForm onSubmit={onSubmit} />)

        // Validar renderizado inicial
        expect(screen.getByLabelText("Username")).toBeInTheDocument()

        // Submit vacío
        await user.click(screen.getByRole("button", { name: "Submit" }))

        await waitFor(() => {
            expect(screen.getByText("Username must be at least 2 characters.")).toBeInTheDocument()
        })

        // Escribir valor válido
        const input = screen.getByLabelText("Username")
        await user.type(input, "testuser") // user.type es mejor que fireEvent.change

        // Submit con valor válido
        await user.click(screen.getByRole("button", { name: "Submit" }))

        // 3. Importante: Esperar a que la función sea llamada
        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({ username: "testuser" })
        })
    })
})

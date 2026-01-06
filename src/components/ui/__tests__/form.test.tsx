import React from "react"
import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"

function TestForm() {
  const form = useForm({
    defaultValues: {
      name: "",
    },
  })

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Nombre requerido" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <input data-testid="name-input" {...field} />
              </FormControl>
              <FormDescription>Ingresa tu nombre</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

describe("Form components", () => {
  it("renderiza label, input y descripción", () => {
    render(<TestForm />)

    expect(screen.getByText("Nombre")).toBeInTheDocument()
    expect(screen.getByTestId("name-input")).toBeInTheDocument()
    expect(screen.getByText("Ingresa tu nombre")).toBeInTheDocument()
  })

  it("muestra mensaje de error cuando el campo es inválido", async () => {
    render(<TestForm />)

    // forzamos validación
    const input = screen.getByTestId("name-input")
    input.focus()
    input.blur()

    expect(await screen.findByText("Ingresa tu nombre")).toBeInTheDocument()
  })
})

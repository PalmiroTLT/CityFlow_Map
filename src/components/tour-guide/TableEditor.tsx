import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface TableEditorProps {
  value: string[][];
  onChange: (value: string[][]) => void;
}

export const TableEditor = ({ value, onChange }: TableEditorProps) => {
  const [table, setTable] = useState<string[][]>(
    value.length > 0 ? value : [["", ""], ["", ""]]
  );

  const updateCell = (rowIndex: number, colIndex: number, newValue: string) => {
    const newTable = table.map((row, rIdx) =>
      rIdx === rowIndex
        ? row.map((cell, cIdx) => (cIdx === colIndex ? newValue : cell))
        : row
    );
    setTable(newTable);
    onChange(newTable);
  };

  const addRow = () => {
    const newRow = new Array(table[0]?.length || 2).fill("");
    const newTable = [...table, newRow];
    setTable(newTable);
    onChange(newTable);
  };

  const deleteRow = (rowIndex: number) => {
    if (table.length <= 1) return;
    const newTable = table.filter((_, idx) => idx !== rowIndex);
    setTable(newTable);
    onChange(newTable);
  };

  const addColumn = () => {
    const newTable = table.map(row => [...row, ""]);
    setTable(newTable);
    onChange(newTable);
  };

  const deleteColumn = (colIndex: number) => {
    if (table[0]?.length <= 1) return;
    const newTable = table.map(row => row.filter((_, idx) => idx !== colIndex));
    setTable(newTable);
    onChange(newTable);
  };

  return (
    <div className="space-y-4">
      <Label>Таблица</Label>
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <tbody>
            {table.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-b-0">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="p-2 border-r last:border-r-0">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      placeholder={rowIndex === 0 ? "Заголовок" : "Данные"}
                      className="min-w-[120px]"
                    />
                  </td>
                ))}
                <td className="p-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRow(rowIndex)}
                    disabled={table.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={addRow} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Добавить строку
        </Button>
        <Button onClick={addColumn} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Добавить колонку
        </Button>
        {table[0]?.length > 1 && (
          <Button onClick={() => deleteColumn(table[0].length - 1)} size="sm" variant="outline">
            <Trash2 className="h-4 w-4 mr-2" /> Удалить последнюю колонку
          </Button>
        )}
      </div>
    </div>
  );
};

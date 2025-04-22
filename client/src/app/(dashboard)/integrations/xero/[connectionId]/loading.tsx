import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function XeroDocumentsLoading() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-36 mb-4" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-56 mb-2" />
          <Skeleton className="h-5 w-72" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
            <Skeleton className="h-10 w-full sm:w-1/3" />
            <Skeleton className="h-10 w-full sm:w-2/3" />
          </div>

          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

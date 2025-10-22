import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { Fragment } from "react/jsx-runtime";
import { Button } from "./ui/button";
import { DialogHeader, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Dispatch, useState } from "react";

type NewGroupProps={
    groupOpen:boolean,
    setGroupOpen:Dispatch<React.SetStateAction<boolean>>

}




export function NewGroup({groupOpen,setGroupOpen}:NewGroupProps){


   
  const [groupName, setGroupName] = useState("");

// Example: call your API to create a group
  async function createGroup(event: React.FormEvent) {
    event.preventDefault();
    // await fetch("/api/groups", { method: "POST", ... });
    setGroupOpen(false);
    setGroupName("");
  }





return <Fragment>
         <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new group</DialogTitle>
            <DialogDescription>Choose a name for your group chat.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createGroup} className="space-y-4">
            <Input
              autoFocus
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Weekend Plan"
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setGroupOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!groupName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      
     </Fragment>





}
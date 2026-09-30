import { useEffect, useMemo, useRef, useState } from "react";

import { useOutletContext } from "react-router-dom";



import {

  BookOpen,

  Plus,

  Search,

  Pencil,

  Trash2,

  X,

  Save,

  RefreshCw,

  FileText,

  IndianRupee,

  CheckCircle2,

  CircleOff,

  Bold,

  Italic,

  Underline,

  Heading1,

  Heading2,

  List,

  ListOrdered,

  Quote,

  Link2,

  ImagePlus,

  Loader2,

  Pilcrow,

} from "lucide-react";



import "./AdminNotes.css";

import { NOTE_CATEGORIES } from "../../data/notesContent";



const API_BASE = import.meta.env.DEV

  ? "http://127.0.0.1:5000"

  : import.meta.env.VITE_API_BASE ||

    "https://disha-the-academy.onrender.com";



const EMPTY_FORM = {

  categorySlug: "",

  categoryTitle: "",

  subcategorySlug: "",

  subcategoryTitle: "",

  title: "",

  price: "",

  pdf: "",

  content: "",

  isActive: true,

};



function hasUsefulContent(html) {

  const value = String(html || "");



  if (/<img\b/i.test(value)) {

    return true;

  }



  return (

    value

      .replace(/<[^>]*>/g, " ")

      .replace(/&nbsp;/gi, " ")

      .replace(/&amp;/gi, "&")

      .trim().length > 0

  );

}



function escapeHtml(value) {

  return String(value || "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}



export default function AdminNotes() {

  const { adminToken } = useOutletContext();



  const [notes, setNotes] = useState([]);



  const [loading, setLoading] =

    useState(true);



  const [saving, setSaving] =

    useState(false);



  const [

    imageUploading,

    setImageUploading,

  ] = useState(false);



  const [search, setSearch] =

    useState("");



  const [

    statusFilter,

    setStatusFilter,

  ] = useState("all");



  const [message, setMessage] =

    useState("");



  const [error, setError] =

    useState("");



  const [

    modalOpen,

    setModalOpen,

  ] = useState(false);



  const [

    editingNote,

    setEditingNote,

  ] = useState(null);



  const [form, setForm] =

    useState(EMPTY_FORM);



  const [

    editorInitialHtml,

    setEditorInitialHtml,

  ] = useState("");



  const editorRef =

    useRef(null);



  const imageInputRef =

    useRef(null);



  const savedRangeRef =

    useRef(null);



  // ======================================================

  // LOAD NOTES

  // ======================================================



  async function loadNotes() {

    try {

      setLoading(true);

      setError("");



      const response =

        await fetch(

          `${API_BASE}/api/admin/notes`,

          {

            headers: {

              Authorization: `Bearer ${adminToken}`,

            },

          }

        );



      const data =

        await response

          .json()

          .catch(() => ({}));



      if (!response.ok) {

        throw new Error(

          data.message ||

            "Failed to load notes."

        );

      }



      setNotes(

        data.notes || []

      );

    } catch (err) {

      console.error(err);



      setError(

        err.message ||

          "Unable to load notes."

      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    if (adminToken) {

      loadNotes();

    }

  }, [adminToken]);



  // ======================================================

  // STATS

  // ======================================================



  const stats =

    useMemo(() => {

      const total =

        notes.length;



      const active =

        notes.filter(

          (note) =>

            note.isActive

        ).length;



      return {

        total,



        active,



        inactive:

          total - active,



        withContent:

          notes.filter(

            (note) =>

              hasUsefulContent(

                note.content

              )

          ).length,

      };

    }, [notes]);
  // ======================================================
  // CATEGORY / SECTION OPTIONS
  // Uses the static catalog, so categories are available even
  // when MongoDB has no notes yet.
  // ======================================================

  const categoryOptions = useMemo(() => {
    return NOTE_CATEGORIES.map((category) => ({
      slug: category.slug,
      title: category.title,
    }));
  }, []);

  const subcategoryOptions = useMemo(() => {
    if (!form.categorySlug) {
      return [];
    }

    const selectedCategory = NOTE_CATEGORIES.find(
      (category) => category.slug === form.categorySlug
    );

    if (!selectedCategory) {
      return [];
    }

    return selectedCategory.subcategories.map((subcategory) => ({
      slug: subcategory.slug,
      title: subcategory.title,
    }));
  }, [form.categorySlug]);




  // ======================================================

  // FILTER

  // ======================================================



  const filteredNotes =

    useMemo(() => {

      const query =

        search

          .trim()

          .toLowerCase();



      return notes.filter(

        (note) => {

          const matchesSearch =

            !query ||



            note.title

              ?.toLowerCase()

              .includes(query) ||



            note.categoryTitle

              ?.toLowerCase()

              .includes(query) ||



            note.subcategoryTitle

              ?.toLowerCase()

              .includes(query) ||



            String(

              note.id

            ).includes(query);



          const matchesStatus =

            statusFilter ===

              "all" ||



            (statusFilter ===

              "active" &&

              note.isActive) ||



            (statusFilter ===

              "inactive" &&

              !note.isActive);



          return (

            matchesSearch &&

            matchesStatus

          );

        }

      );

    }, [

      notes,

      search,

      statusFilter,

    ]);



  // ======================================================

  // OPEN CREATE

  // ======================================================



  function openCreateModal() {

    setEditingNote(null);



    setForm(

      EMPTY_FORM

    );



    setEditorInitialHtml(

      ""

    );



    setError("");

    setMessage("");



    savedRangeRef.current =

      null;



    setModalOpen(true);

  }



  // ======================================================

  // OPEN EDIT

  // ======================================================



  function openEditModal(

    note

  ) {

    setEditingNote(

      note

    );



    setForm({

      categorySlug:

        note.categorySlug ||

        "",



      categoryTitle:

        note.categoryTitle ||

        "",



      subcategorySlug:

        note.subcategorySlug ||

        "",



      subcategoryTitle:

        note.subcategoryTitle ||

        "",



      title:

        note.title || "",



      price:

        note.price ?? "",



      pdf:

        note.pdf || "",



      content:

        note.content || "",



      isActive:

        Boolean(

          note.isActive

        ),

    });



    setEditorInitialHtml(

      note.content || ""

    );



    setError("");

    setMessage("");



    savedRangeRef.current =

      null;



    setModalOpen(true);

  }



  // ======================================================

  // CLOSE MODAL

  // ======================================================



  function closeModal() {

    if (

      saving ||

      imageUploading

    ) {

      return;

    }



    setModalOpen(false);



    setEditingNote(null);



    setForm(

      EMPTY_FORM

    );



    setEditorInitialHtml(

      ""

    );



    savedRangeRef.current =

      null;

  }



  // ======================================================

  // FORM CHANGE

  // ======================================================



  function handleChange(

    event

  ) {

    const {

      name,

      value,

      type,

      checked,

    } = event.target;



    setForm(

      (current) => ({

        ...current,



        [name]:

          type ===

          "checkbox"

            ? checked

            : value,

      })

    );

  }



  function handleCategorySelect(

    event

  ) {

    const selectedSlug =

      event.target.value;



    const selected =

      categoryOptions.find(

        (item) =>

          item.slug ===

          selectedSlug

      );



    setForm(

      (current) => ({

        ...current,



        categorySlug:

          selectedSlug,



        categoryTitle:

          selected?.title ||

          "",



        subcategorySlug:

          "",



        subcategoryTitle:

          "",

      })

    );

  }



  function handleSubcategorySelect(

    event

  ) {

    const selectedSlug =

      event.target.value;



    const selected =

      subcategoryOptions.find(

        (item) =>

          item.slug ===

          selectedSlug

      );



    setForm(

      (current) => ({

        ...current,



        subcategorySlug:

          selectedSlug,



        subcategoryTitle:

          selected?.title ||

          "",

      })

    );

  }



  // ======================================================

  // REMEMBER EDITOR CURSOR

  // ======================================================



  function rememberEditorSelection() {

    const editor =

      editorRef.current;



    const selection =

      window.getSelection();



    if (

      !editor ||

      !selection ||

      selection.rangeCount ===

        0

    ) {

      return;

    }



    const range =

      selection.getRangeAt(

        0

      );



    if (

      editor.contains(

        range.commonAncestorContainer

      )

    ) {

      savedRangeRef.current =

        range.cloneRange();

    }

  }



  // ======================================================

  // RESTORE EDITOR CURSOR

  // ======================================================



  function restoreEditorSelection() {

    const editor =

      editorRef.current;



    if (!editor) {

      return;

    }



    editor.focus();



    const selection =

      window.getSelection();



    if (!selection) {

      return;

    }



    selection.removeAllRanges();



    if (

      savedRangeRef.current

    ) {

      try {

        selection.addRange(

          savedRangeRef.current

        );



        return;

      } catch {

        savedRangeRef.current =

          null;

      }

    }



    const range =

      document.createRange();



    range.selectNodeContents(

      editor

    );



    range.collapse(false);



    selection.addRange(

      range

    );

  }



  // ======================================================

  // EDITOR COMMAND

  // ======================================================



  function runEditorCommand(

    command,

    value = null

  ) {

    restoreEditorSelection();



    document.execCommand(

      command,

      false,

      value

    );



    rememberEditorSelection();

  }



  // ======================================================

  // ADD LINK

  // ======================================================



  function addLink() {

    rememberEditorSelection();



    const enteredUrl =

      window.prompt(

        "Enter link URL, for example: https://example.com"

      );



    if (!enteredUrl) {

      return;

    }



    let finalUrl =

      enteredUrl.trim();



    if (

      !/^https?:\/\//i.test(

        finalUrl

      ) &&

      !/^mailto:/i.test(

        finalUrl

      )

    ) {

      finalUrl =

        `https://${finalUrl}`;

    }



    runEditorCommand(

      "createLink",

      finalUrl

    );

  }



  // ======================================================

  // OPEN IMAGE PICKER

  // ======================================================



  function openImagePicker() {

    rememberEditorSelection();



    imageInputRef.current

      ?.click();

  }



  // ======================================================

  // INSERT IMAGE IN ARTICLE

  // ======================================================



  function insertUploadedImage(

    imageUrl,

    fileName

  ) {

    restoreEditorSelection();



    const cleanName =

      String(

        fileName ||

          "Note image"

      )

        .replace(

          /\.[^.]+$/,

          ""

        )

        .trim();



    const safeAlt =

      escapeHtml(

        cleanName ||

          "Note image"

      );



    const imageHtml = `

      <figure class="note-book-image">

        <img

          src="${imageUrl}"

          alt="${safeAlt}"

        />

        <figcaption>

          Write image caption here

        </figcaption>

      </figure>

      <p><br></p>

    `;



    document.execCommand(

      "insertHTML",

      false,

      imageHtml

    );



    rememberEditorSelection();

  }



  // ======================================================

  // IMAGE UPLOAD

  // ======================================================



  async function handleEditorImages(

    event

  ) {

    const files =

      Array.from(

        event.target.files ||

          []

      );



    event.target.value =

      "";



    if (!files.length) {

      return;

    }



    try {

      setImageUploading(

        true

      );



      setError("");



      for (

        const file of files

      ) {

        const formData =

          new FormData();



        formData.append(

          "image",

          file

        );



        const response =

          await fetch(

            `${API_BASE}/api/admin/notes/upload-image`,

            {

              method:

                "POST",



              headers: {

                Authorization: `Bearer ${adminToken}`,

              },



              body:

                formData,

            }

          );



        const data =

          await response

            .json()

            .catch(

              () => ({})

            );



        if (

          !response.ok ||

          !data.imageUrl

        ) {

          throw new Error(

            data.message ||

              `Unable to upload ${file.name}.`

          );

        }



        insertUploadedImage(

          data.imageUrl,

          file.name

        );

      }

    } catch (err) {

      console.error(err);



      setError(

        err.message ||

          "Unable to upload note image."

      );

    } finally {

      setImageUploading(

        false

      );

    }

  }



  // ======================================================

  // SAVE NOTE

  // ======================================================



  async function handleSubmit(

    event

  ) {

    event.preventDefault();



    const payload = {

      categorySlug:

        form.categorySlug.trim(),



      categoryTitle:

        form.categoryTitle.trim(),



      subcategorySlug:

        form.subcategorySlug.trim(),



      subcategoryTitle:

        form.subcategoryTitle.trim(),



      title:

        form.title.trim(),



      price:

        Number(

          form.price

        ),



      // Old PDF value preserved

      pdf:

        form.pdf || "",



      // New book/article HTML

      content:

        editorRef.current

          ?.innerHTML || "",



      isActive:

        Boolean(

          form.isActive

        ),

    };



    if (

      !payload.categorySlug ||

      !payload.categoryTitle ||

      !payload.subcategorySlug ||

      !payload.subcategoryTitle ||

      !payload.title

    ) {

      setError(

        "Please fill all required fields."

      );



      return;

    }



    if (

      !Number.isFinite(

        payload.price

      ) ||

      payload.price < 0

    ) {

      setError(

        "Please enter a valid price."

      );



      return;

    }



    if (

      !hasUsefulContent(

        payload.content

      )

    ) {

      setError(

        "Please write note content before saving."

      );



      return;

    }



    try {

      setSaving(true);



      setError("");

      setMessage("");



      const isEditing =

        Boolean(

          editingNote

        );



      const url =

        isEditing

          ? `${API_BASE}/api/admin/notes/${editingNote.id}`

          : `${API_BASE}/api/admin/notes`;



      const response =

        await fetch(

          url,

          {

            method:

              isEditing

                ? "PUT"

                : "POST",



            headers: {

              "Content-Type":

                "application/json",



              Authorization: `Bearer ${adminToken}`,

            },



            body:

              JSON.stringify(

                payload

              ),

          }

        );



      const data =

        await response

          .json()

          .catch(

            () => ({})

          );



      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to save note."

        );

      }



      setMessage(

        data.message ||

          (

            isEditing

              ? "Note updated successfully."

              : "Note created successfully."

          )

      );



      setModalOpen(

        false

      );



      setEditingNote(

        null

      );



      setForm(

        EMPTY_FORM

      );



      setEditorInitialHtml(

        ""

      );



      savedRangeRef.current =

        null;



      await loadNotes();

    } catch (err) {

      console.error(err);



      setError(

        err.message ||

          "Unable to save note."

      );

    } finally {

      setSaving(false);

    }

  }



  // ======================================================

  // DEACTIVATE NOTE

  // ======================================================



  async function deactivateNote(

    note

  ) {

    const confirmed =

      window.confirm(

        `Deactivate "${note.title}"?\n\nIt will stop appearing as an active note, but old order data will remain safe.`

      );



    if (!confirmed) {

      return;

    }



    try {

      setError("");

      setMessage("");



      const response =

        await fetch(

          `${API_BASE}/api/admin/notes/${note.id}`,

          {

            method:

              "DELETE",



            headers: {

              Authorization: `Bearer ${adminToken}`,

            },

          }

        );



      const data =

        await response

          .json()

          .catch(

            () => ({})

          );



      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to deactivate note."

        );

      }



      setMessage(

        "Note deactivated successfully."

      );



      await loadNotes();

    } catch (err) {

      console.error(err);



      setError(

        err.message ||

          "Unable to deactivate note."

      );

    }

  }



  // ======================================================

  // REACTIVATE NOTE

  // ======================================================



  async function reactivateNote(

    note

  ) {

    try {

      setError("");

      setMessage("");



      const response =

        await fetch(

          `${API_BASE}/api/admin/notes/${note.id}`,

          {

            method:

              "PUT",



            headers: {

              "Content-Type":

                "application/json",



              Authorization: `Bearer ${adminToken}`,

            },



            body:

              JSON.stringify({

                categorySlug:

                  note.categorySlug,



                categoryTitle:

                  note.categoryTitle,



                subcategorySlug:

                  note.subcategorySlug,



                subcategoryTitle:

                  note.subcategoryTitle,



                title:

                  note.title,



                price:

                  note.price,



                pdf:

                  note.pdf ||

                  "",



                isActive:

                  true,

              }),

          }

        );



      const data =

        await response

          .json()

          .catch(

            () => ({})

          );



      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to activate note."

        );

      }



      setMessage(

        "Note activated successfully."

      );



      await loadNotes();

    } catch (err) {

      console.error(err);



      setError(

        err.message ||

          "Unable to activate note."

      );

    }

  }



  return (

    <div className="admin-notes-page">



      {/* HEADER */}



      <div className="admin-notes-heading">

        <div>



          <span className="admin-notes-eyebrow">

            CONTENT MANAGEMENT

          </span>



          <h2>

            Notes Management

          </h2>



          <p>

            Create book-style study notes with text,

            images and pricing.

          </p>



        </div>



        <div className="admin-notes-heading-actions">



          <button

            type="button"

            className="admin-notes-refresh"

            onClick={

              loadNotes

            }

            disabled={

              loading

            }

          >



            <RefreshCw

              size={17}

              className={

                loading

                  ? "admin-notes-spin"

                  : ""

              }

            />



            Refresh



          </button>



          <button

            type="button"

            className="admin-notes-add"

            onClick={

              openCreateModal

            }

          >



            <Plus size={18} />



            Add Note



          </button>



        </div>

      </div>



      {/* ALERTS */}



      {message && (



        <div className="admin-notes-alert success">



          <CheckCircle2

            size={18}

          />



          {message}



        </div>



      )}



      {error && (



        <div className="admin-notes-alert error">



          <CircleOff

            size={18}

          />



          {error}



        </div>



      )}



      {/* STATS */}



      <div className="admin-notes-stats">



        <div className="admin-notes-stat">



          <BookOpen

            size={22}

          />



          <div>



            <span>

              Total Notes

            </span>



            <strong>

              {stats.total}

            </strong>



          </div>



        </div>



        <div className="admin-notes-stat">



          <CheckCircle2

            size={22}

          />



          <div>



            <span>

              Active

            </span>



            <strong>

              {stats.active}

            </strong>



          </div>



        </div>



        <div className="admin-notes-stat">



          <CircleOff

            size={22}

          />



          <div>



            <span>

              Inactive

            </span>



            <strong>

              {stats.inactive}

            </strong>



          </div>



        </div>



        <div className="admin-notes-stat">



          <FileText

            size={22}

          />



          <div>



            <span>

              Content Ready

            </span>



            <strong>

              {stats.withContent}

            </strong>



          </div>



        </div>



      </div>



      {/* SEARCH */}



      <div className="admin-notes-toolbar">



        <div className="admin-notes-search">



          <Search

            size={18}

          />



          <input

            type="text"

            placeholder="Search by title, category or ID..."

            value={

              search

            }

            onChange={

              (

                event

              ) =>

                setSearch(

                  event

                    .target

                    .value

                )

            }

          />



        </div>



        <select

          value={

            statusFilter

          }

          onChange={

            (

              event

            ) =>

              setStatusFilter(

                event

                  .target

                  .value

              )

          }

        >



          <option value="all">

            All Notes

          </option>



          <option value="active">

            Active

          </option>



          <option value="inactive">

            Inactive

          </option>



        </select>



      </div>



      {/* TABLE */}



      <div className="admin-notes-table-card">



        {loading ? (



          <div className="admin-notes-empty">



            <RefreshCw

              className="admin-notes-spin"

              size={28}

            />



            <p>

              Loading notes...

            </p>



          </div>



        ) : filteredNotes.length ===

          0 ? (



          <div className="admin-notes-empty">



            <BookOpen

              size={32}

            />



            <h3>

              No notes found

            </h3>



            <p>

              Try changing your search or filter.

            </p>



          </div>



        ) : (



          <div className="admin-notes-table-wrap">



            <table className="admin-notes-table">



              <thead>



                <tr>



                  <th>

                    ID

                  </th>



                  <th>

                    Note

                  </th>



                  <th>

                    Category

                  </th>



                  <th>

                    Price

                  </th>



                  <th>

                    Content

                  </th>



                  <th>

                    Status

                  </th>



                  <th>

                    Actions

                  </th>



                </tr>



              </thead>



              <tbody>



                {filteredNotes.map(

                  (

                    note

                  ) => (



                    <tr

                      key={

                        note.id

                      }

                    >



                      <td>



                        <span className="admin-note-id">



                          #

                          {

                            note.id

                          }



                        </span>



                      </td>



                      <td>



                        <div className="admin-note-title-cell">



                          <strong>

                            {

                              note.title

                            }

                          </strong>



                          <span>

                            {

                              note.subcategoryTitle

                            }

                          </span>



                        </div>



                      </td>



                      <td>



                        <div className="admin-note-category">



                          <strong>

                            {

                              note.categoryTitle

                            }

                          </strong>



                          <span>

                            {

                              note.categorySlug

                            }

                          </span>



                        </div>



                      </td>



                      <td>



                        <span className="admin-note-price">



                          <IndianRupee

                            size={14}

                          />



                          {

                            note.price

                          }



                        </span>



                      </td>



                      <td>



                        {hasUsefulContent(

                          note.content

                        ) ? (



                          <span className="admin-note-content-ready">



                            <BookOpen

                              size={15}

                            />



                            Ready



                          </span>



                        ) : (



                          <span className="admin-note-no-pdf">



                            Empty



                          </span>



                        )}



                      </td>



                      <td>



                        <span

                          className={`admin-note-status ${

                            note.isActive

                              ? "active"

                              : "inactive"

                          }`}

                        >



                          {

                            note.isActive

                              ? "Active"

                              : "Inactive"

                          }



                        </span>



                      </td>



                      <td>



                        <div className="admin-note-actions">



                          <button

                            type="button"

                            className="edit"

                            title="Edit note"

                            onClick={

                              () =>

                                openEditModal(

                                  note

                                )

                            }

                          >



                            <Pencil

                              size={16}

                            />



                          </button>



                          {note.isActive ? (



                            <button

                              type="button"

                              className="delete"

                              title="Deactivate note"

                              onClick={

                                () =>

                                  deactivateNote(

                                    note

                                  )

                              }

                            >



                              <Trash2

                                size={16}

                              />



                            </button>



                          ) : (



                            <button

                              type="button"

                              className="activate"

                              title="Activate note"

                              onClick={

                                () =>

                                  reactivateNote(

                                    note

                                  )

                              }

                            >



                              <CheckCircle2

                                size={16}

                              />



                            </button>



                          )}



                        </div>



                      </td>



                    </tr>



                  )

                )}



              </tbody>



            </table>



          </div>



        )}



      </div>



      <div className="admin-notes-results">



        Showing{" "}



        <strong>

          {

            filteredNotes.length

          }

        </strong>{" "}



        of{" "}



        <strong>

          {

            notes.length

          }

        </strong>{" "}



        notes



      </div>



      {/* ADD / EDIT MODAL */}



      {modalOpen && (



        <div

          className="admin-notes-modal-overlay"

          onMouseDown={

            (

              event

            ) => {



              if (

                event.target ===

                event.currentTarget

              ) {

                closeModal();

              }



            }

          }

        >



          <div className="admin-notes-modal admin-notes-book-modal">



            <div className="admin-notes-modal-header">



              <div>



                <span>



                  {

                    editingNote

                      ? `NOTE #${editingNote.id}`

                      : "NEW NOTE"

                  }



                </span>



                <h3>



                  {

                    editingNote

                      ? "Edit Note"

                      : "Add New Note"

                  }



                </h3>



              </div>



              <button

                type="button"

                onClick={

                  closeModal

                }

                disabled={

                  saving ||

                  imageUploading

                }

              >



                <X

                  size={21}

                />



              </button>



            </div>



            <form

              onSubmit={

                handleSubmit

              }

            >



              <div className="admin-notes-form-grid">



                {/* CATEGORY */}



                <div className="admin-notes-field full">



                  <label>

                    1. Select Category *

                  </label>



                  <select

                    value={

                      form.categorySlug

                    }

                    onChange={

                      handleCategorySelect

                    }

                    required

                  >



                    <option value="">

                      Select Category

                    </option>



                    {categoryOptions.map(

                      (

                        category

                      ) => (



                        <option

                          key={

                            category.slug

                          }

                          value={

                            category.slug

                          }

                        >



                          {

                            category.title

                          }



                        </option>



                      )

                    )}



                  </select>



                </div>



                {/* SECTION */}



                <div className="admin-notes-field full">



                  <label>

                    2. Select Notes Section *

                  </label>



                  <select

                    value={

                      form.subcategorySlug

                    }

                    onChange={

                      handleSubcategorySelect

                    }

                    disabled={

                      !form.categorySlug

                    }

                    required

                  >



                    <option value="">



                      {

                        form.categorySlug

                          ? "Select Notes Section"

                          : "First select category"

                      }



                    </option>



                    {subcategoryOptions.map(

                      (

                        subcategory

                      ) => (



                        <option

                          key={

                            subcategory.slug

                          }

                          value={

                            subcategory.slug

                          }

                        >



                          {

                            subcategory.title

                          }



                        </option>



                      )

                    )}



                  </select>



                </div>



                {/* TITLE */}



                <div className="admin-notes-field full">



                  <label>

                    3. Notes Title *

                  </label>



                  <input

                    type="text"

                    name="title"

                    value={

                      form.title

                    }

                    onChange={

                      handleChange

                    }

                    placeholder="Example: HP History Complete Notes"

                    required

                  />



                </div>



                {/* PRICE */}



                <div className="admin-notes-field full">



                  <label>

                    4. Price (₹) *

                  </label>



                  <input

                    type="number"

                    name="price"

                    value={

                      form.price

                    }

                    onChange={

                      handleChange

                    }

                    min="0"

                    step="1"

                    placeholder="49"

                    required

                  />



                </div>



                {/* CONTENT EDITOR */}



                <div className="admin-notes-field full">



                  <label>

                    5. Notes Content *

                  </label>



                  <div className="admin-note-editor-shell">



                    {/* EDITOR TOOLBAR */}



                    <div className="admin-note-editor-toolbar">



                      <button

                        type="button"

                        title="Paragraph"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "formatBlock",

                              "p"

                            );



                          }

                        }

                      >



                        <Pilcrow

                          size={17}

                        />



                      </button>



                      <button

                        type="button"

                        title="Heading 1"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "formatBlock",

                              "h1"

                            );



                          }

                        }

                      >



                        <Heading1

                          size={17}

                        />



                      </button>



                      <button

                        type="button"

                        title="Heading 2"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "formatBlock",

                              "h2"

                            );



                          }

                        }

                      >



                        <Heading2

                          size={17}

                        />



                      </button>



                      <span className="admin-note-editor-separator" />



                      <button

                        type="button"

                        title="Bold"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "bold"

                            );



                          }

                        }

                      >



                        <Bold

                          size={17}

                        />



                      </button>



                      <button

                        type="button"

                        title="Italic"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "italic"

                            );



                          }

                        }

                      >



                        <Italic

                          size={17}

                        />



                      </button>



                      <button

                        type="button"

                        title="Underline"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "underline"

                            );



                          }

                        }

                      >



                        <Underline

                          size={17}

                        />



                      </button>



                      <span className="admin-note-editor-separator" />



                      <button

                        type="button"

                        title="Bullet list"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "insertUnorderedList"

                            );



                          }

                        }

                      >



                        <List

                          size={17}

                        />



                      </button>



                      <button

                        type="button"

                        title="Numbered list"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "insertOrderedList"

                            );



                          }

                        }

                      >



                        <ListOrdered

                          size={17}

                        />



                      </button>



                      <button

                        type="button"

                        title="Quote"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            runEditorCommand(

                              "formatBlock",

                              "blockquote"

                            );



                          }

                        }

                      >



                        <Quote

                          size={17}

                        />



                      </button>



                      <button

                        type="button"

                        title="Add link"

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            addLink();



                          }

                        }

                      >



                        <Link2

                          size={17}

                        />



                      </button>



                      <span className="admin-note-editor-separator" />



                      {/* MULTIPLE IMAGE BUTTON */}



                      <button

                        type="button"

                        className="admin-note-editor-image-button"

                        title="Insert one or more images"

                        disabled={

                          imageUploading

                        }

                        onMouseDown={

                          (

                            event

                          ) => {



                            event.preventDefault();



                            openImagePicker();



                          }

                        }

                      >



                        {

                          imageUploading

                            ? (



                              <Loader2

                                size={17}

                                className="admin-notes-spin"

                              />



                            )

                            : (



                              <ImagePlus

                                size={17}

                              />



                            )

                        }



                        <span>



                          {

                            imageUploading

                              ? "Uploading..."

                              : "Add Images"

                          }



                        </span>



                      </button>



                      <input

                        ref={

                          imageInputRef

                        }

                        type="file"

                        accept="image/jpeg,image/png,image/webp"

                        multiple

                        className="admin-note-editor-file-input"

                        onChange={

                          handleEditorImages

                        }

                      />



                    </div>



                    {/* BOOK EDITOR */}



                    <div

                      key={

                        editingNote

                          ? `edit-${editingNote.id}`

                          : "new-note"

                      }

                      ref={

                        editorRef

                      }

                      className="admin-note-editor"

                      contentEditable

                      suppressContentEditableWarning

                      data-placeholder="Start writing your note like a book chapter..."

                      dangerouslySetInnerHTML={{

                        __html:

                          editorInitialHtml,

                      }}

                      onInput={

                        rememberEditorSelection

                      }

                      onKeyUp={

                        rememberEditorSelection

                      }

                      onMouseUp={

                        rememberEditorSelection

                      }

                      onBlur={

                        rememberEditorSelection

                      }

                    />



                    <div className="admin-note-editor-help">



                      You can select multiple images at once.

                      Each image gets an editable caption.



                    </div>



                  </div>



                </div>



                {/* ACTIVE */}



                <div className="admin-notes-field full">



                  <label className="admin-notes-toggle">



                    <input

                      type="checkbox"

                      name="isActive"

                      checked={

                        form.isActive

                      }

                      onChange={

                        handleChange

                      }

                    />



                    <span className="admin-notes-toggle-switch"></span>



                    <div>



                      <strong>

                        Active Note

                      </strong>



                      <small>

                        Active notes can be shown to students.

                      </small>



                    </div>



                  </label>



                </div>



              </div>



              <div className="admin-notes-modal-footer">



                <button

                  type="button"

                  className="admin-notes-cancel"

                  onClick={

                    closeModal

                  }

                  disabled={

                    saving ||

                    imageUploading

                  }

                >



                  Cancel



                </button>



                <button

                  type="submit"

                  className="admin-notes-save"

                  disabled={

                    saving ||

                    imageUploading

                  }

                >



                  <Save

                    size={17}

                  />



                  {

                    saving

                      ? "Saving..."

                      : editingNote

                      ? "Save Changes"

                      : "Add Note"

                  }



                </button>



              </div>



            </form>



          </div>



        </div>



      )}



    </div>

  );

}
